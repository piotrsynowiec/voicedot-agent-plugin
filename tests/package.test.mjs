import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { renderCompatibility } from '../scripts/generate-openai-compat.mjs';
import { generateClaudeAdapter, renderClaudeAdapter } from '../scripts/generate-claude-adapter.mjs';
import { buildPackage, parseUstar, serializeStableGzip, validateUstarInventory } from '../scripts/package.mjs';
import { validateMcp, validatePackage, validatePlugin } from '../scripts/validate-package.mjs';

const root = resolve(import.meta.dirname, '..');
const json = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

test('portable manifests validate and generate the checked-in compatibility artifacts', () => {
  const plugin = json('plugin.json');
  const mcp = json('mcp.json');
  validatePlugin(plugin);
  validateMcp(mcp);
  assert.deepEqual(renderCompatibility(plugin, mcp), { plugin: json('.codex-plugin/plugin.json'), mcp: json('.mcp.json') });
});

test('importing generator APIs does not write and generation is deterministic', async () => {
  const before = [readFileSync(resolve(root, '.codex-plugin/plugin.json'), 'utf8'), readFileSync(resolve(root, '.mcp.json'), 'utf8')];
  const module = await import(`../scripts/generate-openai-compat.mjs?test=${Date.now()}`);
  assert.equal(typeof module.generateCompatibility, 'function');
  assert.deepEqual(before, [readFileSync(resolve(root, '.codex-plugin/plugin.json'), 'utf8'), readFileSync(resolve(root, '.mcp.json'), 'utf8')]);
  assert.deepEqual(module.renderCompatibility(json('plugin.json'), json('mcp.json')), { plugin: json('.codex-plugin/plugin.json'), mcp: json('.mcp.json') });
  assert.deepEqual(before, [readFileSync(resolve(root, '.codex-plugin/plugin.json'), 'utf8'), readFileSync(resolve(root, '.mcp.json'), 'utf8')]);
});

test('archive, inventory, and digest are reproducible and use a stable safe file order', () => {
  const first = buildPackage();
  const second = buildPackage();
  assert.deepEqual(first, second);
  const inventory = JSON.parse(first.inventory);
  assert.deepEqual(inventory.files.map((file) => file.path), [...inventory.files.map((file) => file.path)].sort((left, right) => left.localeCompare(right)));
  assert.ok(inventory.files.every((file) => !file.path.includes('..') && !file.path.startsWith('/') && file.path !== 'AGENTS.md'));
  assert.ok(inventory.files.every((file) => !['scripts/', 'tests/', 'reviewer/', '.github/', 'node_modules/', 'dist/'].some((prefix) => file.path.startsWith(prefix))));
  assert.match(first.digest, new RegExp(`^[a-f0-9]{64}  voicedot-agent-plugin-${json('plugin.json').version.replaceAll('.', '\\.')}\\.tar\\.gz\\n$`));
  const parsed = parseUstar(first.archive);
  assert.deepEqual(parsed.map(({ path }) => path), inventory.files.map(({ path }) => path));
  assert.doesNotThrow(() => validateUstarInventory(first.archive, inventory));
  const brokenInventory = structuredClone(inventory);
  brokenInventory.files[0].sha256 = '0'.repeat(64);
  assert.throws(() => validateUstarInventory(first.archive, brokenInventory), /payload does not match inventory/);
  const archiveText = gunzipSync(first.archive).toString('utf8');
  assert.doesNotMatch(archiveText, /plugin_asdk_app[\w-]{8,}|authorization\s*[:=]\s*bearer\s+[A-Za-z0-9._-]{12,}|\/Users\//i);
});

test('gzip serialization has one fixed stored-DEFLATE form and is exactly repeatable', () => {
  const payload = Buffer.concat([Buffer.from('VoiceDot\n'), Buffer.alloc(0x10000 + 3, 0x61)]);
  const first = serializeStableGzip(payload);
  const second = serializeStableGzip(Buffer.from(payload));
  assert.deepEqual(first, second);
  assert.deepEqual(first.subarray(0, 10), Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff]));
  let offset = 10;
  for (;;) {
    const final = first[offset] & 1;
    assert.equal(first[offset] & 0xfe, 0, 'DEFLATE uses byte-aligned stored blocks only');
    const length = first.readUInt16LE(offset + 1);
    assert.equal(first.readUInt16LE(offset + 3), (~length) & 0xffff);
    offset += 5 + length;
    if (final) break;
  }
  assert.equal(offset + 8, first.length, 'only the fixed gzip trailer follows DEFLATE blocks');
  assert.deepEqual(gunzipSync(first), payload);
});

test('Claude adapter is a byte-for-byte generated projection of canonical metadata and skill files', () => {
  const plugin = json('plugin.json');
  const mcp = json('mcp.json');
  const expected = generateClaudeAdapter({ check: true });
  assert.deepEqual(renderClaudeAdapter(plugin, mcp).mcp, json('adapters/claude-code/.mcp.json'));
  for (const [path, content] of expected.files) {
    assert.equal(readFileSync(resolve(root, 'adapters/claude-code', path), 'utf8'), content);
  }
});

test('invalid portable schema, transport, secret headers, and unknown fields are rejected', () => {
  const plugin = json('plugin.json');
  assert.throws(() => validatePlugin({ ...plugin, skills: './skills/' }), /unsupported field/);
  const mcp = json('mcp.json');
  assert.throws(() => validateMcp({ ...mcp, mcpServers: { voicedot: { type: 'http', url: 'http://mcp.voicedot.ai/mcp' } } }), /transport or URL/);
  assert.throws(() => validateMcp({ ...mcp, mcpServers: { voicedot: { ...mcp.mcpServers.voicedot, headers: { Authorization: 'Bearer token' } } } }), /must not contain headers/);
});

test('canonical skill is the sole hand-edited review workflow source', () => {
  const skill = readFileSync(resolve(root, 'skills/review-voicedot-feedback/SKILL.md'), 'utf8');
  assert.match(skill, /^---\nname: review-voicedot-feedback\n/m);
  assert.match(skill, /untrusted evidence/i);
  assert.match(skill, /read-only/i);
  validatePackage();
});
