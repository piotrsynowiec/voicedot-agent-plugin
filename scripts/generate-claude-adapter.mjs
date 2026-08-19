import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const adapterRoot = resolve(root, 'adapters/claude-code');
const canonicalSkill = resolve(root, 'skills/review-voicedot-feedback');
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function renderClaudeAdapter(plugin, mcp) {
  const server = mcp.mcpServers.voicedot;
  if (server.type !== 'streamable-http') throw new Error('Claude adapter requires the canonical streamable-http server.');
  return {
    manifest: {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: { name: plugin.author.name }
    },
    mcp: { mcpServers: { voicedot: { type: 'http', url: server.url } } }
  };
}

function listFiles(path = adapterRoot) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? listFiles(child) : [child];
  });
}

export function generatedAdapter() {
  const output = renderClaudeAdapter(readJson('plugin.json'), readJson('mcp.json'));
  return {
    files: new Map([
      ['.claude-plugin/plugin.json', json(output.manifest)],
      ['.mcp.json', json(output.mcp)],
      ...listFiles(canonicalSkill).map((path) => [relative(canonicalSkill, path).replace(/^/, 'skills/review-voicedot-feedback/'), readFileSync(path, 'utf8')])
    ])
  };
}

export function generateClaudeAdapter({ check = false } = {}) {
  const output = generatedAdapter();
  if (check) {
    if (!existsSync(adapterRoot)) throw new Error('Claude adapter is missing; run npm run generate.');
    const actual = new Map(listFiles(adapterRoot).map((path) => [relative(adapterRoot, path), readFileSync(path, 'utf8')]));
    if (actual.size !== output.files.size || [...output.files].some(([path, content]) => actual.get(path) !== content)) throw new Error('Claude adapter is stale or hand-maintained; run npm run generate.');
  } else {
    rmSync(adapterRoot, { recursive: true, force: true });
    mkdirSync(adapterRoot, { recursive: true });
    for (const [path, content] of output.files) {
      const target = resolve(adapterRoot, path);
      mkdirSync(resolve(target, '..'), { recursive: true });
      writeFileSync(target, content);
    }
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) generateClaudeAdapter({ check: process.argv.includes('--check') });
