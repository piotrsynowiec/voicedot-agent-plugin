import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatePackage } from './validate-package.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const name = 'voicedot-agent-plugin-0.1.0';
const archivePath = resolve(dist, `${name}.tar.gz`);
const inventoryPath = resolve(dist, `${name}.files.json`);
const digestPath = resolve(dist, `${name}.sha256`);
const ignored = new Set(['.git', 'node_modules', 'dist', '.github', 'AGENTS.md']);

function sourceFiles(path = root) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const child = resolve(path, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`symlink cannot be archived: ${relative(root, child)}`);
    return entry.isDirectory() ? sourceFiles(child) : [child];
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
  const archive = gzipSync(tar, { mtime: 0 });
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
