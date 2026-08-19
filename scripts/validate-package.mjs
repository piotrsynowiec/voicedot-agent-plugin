import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { generateClaudeAdapter } from './generate-claude-adapter.mjs';

const root = resolve(import.meta.dirname, '..');
const pluginSchema = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const mcpSchema = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
const parse = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const fail = (message) => { throw new Error(message); };
const keysOnly = (value, allowed, label) => Object.keys(value).every((key) => allowed.includes(key)) || fail(`${label} has an unsupported field`);

export function validatePlugin(plugin) {
  keysOnly(plugin, ['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions'], 'plugin.json');
  if (plugin.$schema !== pluginSchema || plugin.name !== 'voicedot' || plugin.version !== '0.1.0') fail('plugin.json identity or schema is invalid');
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(plugin.name)) fail('plugin name is invalid');
  if (!plugin.author || typeof plugin.author.name !== 'string') fail('plugin author is invalid');
  keysOnly(plugin.author, ['name', 'email', 'url'], 'plugin.json author');
  if (!Array.isArray(plugin.keywords) || !plugin.keywords.every((item) => typeof item === 'string')) fail('plugin keywords are invalid');
}

export function validateMcp(mcp) {
  keysOnly(mcp, ['$schema', 'mcpServers'], 'mcp.json');
  if (mcp.$schema !== mcpSchema || !mcp.mcpServers || Object.keys(mcp.mcpServers).join() !== 'voicedot') fail('mcp.json server list is invalid');
  const server = mcp.mcpServers.voicedot;
  keysOnly(server, ['type', 'url', 'headers'], 'MCP server');
  if (server.type !== 'streamable-http' || server.url !== 'https://mcp.voicedot.ai/mcp' || !server.url.startsWith('https://')) fail('MCP transport or URL is invalid');
  if (server.headers || 'oauth_resource' in server) fail('portable MCP configuration must not contain headers or client authentication fields');
}

function files(path = root) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const child = resolve(path, entry.name);
    if (lstatSync(child).isSymbolicLink()) fail(`symlink is forbidden: ${relative(root, child)}`);
    return entry.isDirectory() ? files(child) : [child];
  });
}

function validateBoundary() {
  const forbidden = [/(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret)\s*[:=]\s*['"]?[A-Za-z0-9_-]{12,}/i, /plugin_asdk_app[\w-]{8,}/i, /authorization\s*[:=]\s*bearer\s+[A-Za-z0-9._-]{12,}/i, /@(?:gmail|icloud|protonmail)\.com/i, /(?:localhost|127\.0\.0\.1|192\.168\.|10\.\d+\.)/i, /\/Users\//];
  for (const path of files()) {
    const rel = relative(root, path);
    if (rel === 'AGENTS.md' || rel === 'scripts/validate-package.mjs' || rel.startsWith('dist/')) continue;
    const text = readFileSync(path, 'utf8');
    if (forbidden.some((pattern) => pattern.test(text))) fail(`public boundary scan failed: ${rel}`);
  }
}

export function validateSkill() {
  const path = resolve(root, 'skills/review-voicedot-feedback/SKILL.md');
  const skill = readFileSync(path, 'utf8');
  if (!skill.startsWith('---\nname: review-voicedot-feedback\n') || !/untrusted evidence/i.test(skill) || !/read-only/i.test(skill) || !/Derived/.test(skill)) fail('canonical skill frontmatter or safety contract is invalid');
  const references = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]);
  if (references.length < 2) fail('canonical skill references are incomplete');
  for (const reference of references) {
    const path = resolve(root, 'skills/review-voicedot-feedback', reference);
    if (!path.startsWith(resolve(root, 'skills/review-voicedot-feedback') + '/') || !existsSync(path)) fail(`canonical skill reference is invalid: ${reference}`);
  }
}

export function validateClaudeAdapter() {
  generateClaudeAdapter({ check: true });
}

export function validatePackage() {
  validatePlugin(parse('plugin.json'));
  validateMcp(parse('mcp.json'));
  validateSkill();
  validateClaudeAdapter();
  validateBoundary();
  execFileSync(process.execPath, ['scripts/generate-openai-compat.mjs', '--check'], { cwd: root, stdio: 'inherit' });
  if (!existsSync(resolve(root, '.codex-plugin/plugin.json')) || !existsSync(resolve(root, '.mcp.json'))) fail('generated OpenAI/Codex files are missing');
  console.log('Portable schema, boundary, skill, and generated compatibility checks passed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) validatePackage();
