import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertPublicText, validatePackage } from './validate-package.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const plugin = JSON.parse(readFileSync(resolve(root, 'plugin.json'), 'utf8'));
const name = `voicedot-agent-plugin-${plugin.version}`;
const archivePath = resolve(dist, `${name}.tar.gz`);
const inventoryPath = resolve(dist, `${name}.files.json`);
const digestPath = resolve(dist, `${name}.sha256`);
const runtimeFiles = new Set([
  '.codex-plugin/plugin.json', '.mcp.json', 'plugin.json', 'mcp.json',
  'README.md', 'LICENSE', 'CHANGELOG.md',
]);
const runtimeDirectories = ['skills/', 'adapters/claude-code/'];

// A gzip stream with uncompressed DEFLATE stored blocks is deliberately used
// here instead of zlib compression. Its bytes are specified below, rather than
// selected by the Node/zlib version or compression heuristics.
const gzipHeader = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff]);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function serializeStableGzip(payload) {
  const blocks = [];
  for (let offset = 0; offset < payload.length || (payload.length === 0 && offset === 0); offset += 0xffff) {
    const chunk = payload.subarray(offset, Math.min(offset + 0xffff, payload.length));
    const final = offset + chunk.length >= payload.length;
    const header = Buffer.alloc(5);
    header[0] = final ? 1 : 0; // BFINAL followed by the 00 stored-block type.
    header.writeUInt16LE(chunk.length, 1);
    header.writeUInt16LE((~chunk.length) & 0xffff, 3);
    blocks.push(header, chunk);
    if (final) break;
  }
  const trailer = Buffer.alloc(8);
  trailer.writeUInt32LE(crc32(payload), 0);
  trailer.writeUInt32LE(payload.length >>> 0, 4);
  return Buffer.concat([gzipHeader, ...blocks, trailer]);
}

const runtimePathAllowed = (path) => runtimeFiles.has(path) || runtimeDirectories.some((prefix) => path.startsWith(prefix));

function sourceFiles(path = root) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    const archivePath = relative(root, child);
    if (entry.isSymbolicLink()) throw new Error(`symlink cannot be archived: ${archivePath}`);
    if (entry.isDirectory()) return runtimeDirectories.some((prefix) => prefix.startsWith(`${archivePath}/`) || archivePath.startsWith(prefix)) ? sourceFiles(child) : [];
    return runtimePathAllowed(archivePath) ? [child] : [];
  }).sort((left, right) => relative(root, left).localeCompare(relative(root, right)));
}

function octal(value, width) {
  return `${value.toString(8).padStart(width - 1, '0')}\0`;
}

function tarHeader(path, size) {
  const header = Buffer.alloc(512);
  header.write(path, 0, Math.min(Buffer.byteLength(path), 100), 'utf8');
  header.write(octal(0o644, 8), 100, 8, 'ascii');
  header.write(octal(0, 8), 108, 8, 'ascii');
  header.write(octal(0, 8), 116, 8, 'ascii');
  header.write(octal(size, 12), 124, 12, 'ascii');
  header.write(octal(0, 12), 136, 12, 'ascii');
  header.fill(0x20, 148, 156);
  header.write('0', 156, 1, 'ascii');
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  const checksum = [...header].reduce((total, value) => total + value, 0);
  header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
  return header;
}

function readOctal(header, start, width, label) {
  const field = header.subarray(start, start + width);
  const value = field.toString('ascii').split('\0', 1)[0].trim();
  if (!/^[0-7]+$/.test(value)) throw new Error(`invalid USTAR ${label}`);
  return Number.parseInt(value, 8);
}

function readString(header, start, width) {
  const field = header.subarray(start, start + width);
  const end = field.indexOf(0);
  return field.subarray(0, end === -1 ? width : end).toString('utf8');
}

function assertSafeRuntimePath(path) {
  if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some((part) => part === '.' || part === '..' || !part)) throw new Error(`unsafe archive path: ${path}`);
  if (!runtimePathAllowed(path)) throw new Error(`unallowlisted runtime archive path: ${path}`);
}

export function parseUstar(archive) {
  const tar = gunzipSync(archive);
  const entries = [];
  let offset = 0;
  let terminated = false;
  while (offset < tar.length) {
    if (offset + 512 > tar.length) throw new Error('truncated USTAR header');
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      if (offset + 1024 !== tar.length || !tar.subarray(offset + 512).every((byte) => byte === 0)) throw new Error('USTAR has extra data after terminator');
      terminated = true;
      break;
    }
    if (header.subarray(257, 263).compare(Buffer.from('ustar\0')) || header.subarray(263, 265).compare(Buffer.from('00'))) throw new Error('archive entry is not USTAR');
    if (readString(header, 345, 155)) throw new Error('USTAR prefix entries are forbidden');
    const expectedChecksum = readOctal(header, 148, 8, 'checksum');
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    if (checksumHeader.reduce((sum, byte) => sum + byte, 0) !== expectedChecksum) throw new Error('invalid USTAR checksum');
    const path = readString(header, 0, 100);
    const type = header[156];
    if (type !== 0 && type !== 48) throw new Error(`non-regular USTAR entry: ${path}`);
    if (readOctal(header, 100, 8, 'mode') !== 0o644 || readOctal(header, 108, 8, 'uid') !== 0 || readOctal(header, 116, 8, 'gid') !== 0 || readOctal(header, 136, 12, 'mtime') !== 0) throw new Error(`nondeterministic USTAR metadata: ${path}`);
    assertSafeRuntimePath(path);
    const size = readOctal(header, 124, 12, 'size');
    const payloadStart = offset + 512;
    const payloadEnd = payloadStart + size;
    if (payloadEnd > tar.length) throw new Error(`truncated USTAR payload: ${path}`);
    entries.push({ path, payload: tar.subarray(payloadStart, payloadEnd) });
    offset = payloadEnd + ((512 - (size % 512)) % 512);
  }
  if (!terminated) throw new Error('USTAR terminator is missing');
  return entries;
}

export function validateUstarInventory(archive, inventory) {
  const entries = parseUstar(archive);
  const expected = inventory.files;
  if (entries.length !== expected.length) throw new Error('USTAR entry count does not match inventory');
  const paths = entries.map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) throw new Error('duplicate USTAR entry');
  if (JSON.stringify(paths) !== JSON.stringify([...paths].sort((left, right) => left.localeCompare(right)))) throw new Error('USTAR entries are not lexically ordered');
  if (JSON.stringify(paths) !== JSON.stringify(expected.map((entry) => entry.path))) throw new Error('USTAR paths do not exactly match inventory');
  for (const [index, entry] of entries.entries()) {
    const expectedEntry = expected[index];
    const sha256 = createHash('sha256').update(entry.payload).digest('hex');
    if (entry.payload.length !== expectedEntry.bytes || sha256 !== expectedEntry.sha256) throw new Error(`USTAR payload does not match inventory: ${entry.path}`);
    assertPublicText(entry.payload, `archive:${entry.path}`);
  }
  return entries;
}

export function buildPackage() {
  validatePackage();
  const files = sourceFiles();
  const inventory = files.map((file) => {
    const content = readFileSync(file);
    return { path: relative(root, file), bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') };
  });
  const tar = Buffer.concat([...files.flatMap((file) => {
    const content = readFileSync(file);
    return [tarHeader(relative(root, file), content.length), content, Buffer.alloc((512 - (content.length % 512)) % 512)];
  }), Buffer.alloc(1024)]);
  const archive = serializeStableGzip(tar);
  validateUstarInventory(archive, { package: name, files: inventory });
  const digest = createHash('sha256').update(archive).digest('hex');
  return { archive, inventory: `${JSON.stringify({ package: name, files: inventory }, null, 2)}\n`, digest: `${digest}  ${name}.tar.gz\n` };
}

export function packageOrCheck({ check = false } = {}) {
  const output = buildPackage();
  if (check) {
    if (readFileSync(archivePath).compare(output.archive) || readFileSync(inventoryPath, 'utf8') !== output.inventory || readFileSync(digestPath, 'utf8') !== output.digest) throw new Error('deterministic archive, inventory, or digest is stale; run npm run package.');
  } else {
    mkdirSync(dist, { recursive: true });
    writeFileSync(archivePath, output.archive);
    writeFileSync(inventoryPath, output.inventory);
    writeFileSync(digestPath, output.digest);
  }
  console.log('Deterministic archive, inventory, and digest are current.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) packageOrCheck({ check: process.argv.includes('--check') });
