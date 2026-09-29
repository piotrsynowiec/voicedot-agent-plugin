import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const writeJson = (path, value) => writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);

export function renderCompatibility(plugin, mcp) {
  const { $schema, extensions, ...metadata } = plugin;
  const { interface: interfaceMetadata = {}, ...openaiMetadata } = extensions?.['com.openai'] || {};
  return {
    plugin: {
      ...metadata,
      extensions: { ...extensions, 'com.openai': openaiMetadata },
      skills: './skills/',
      mcpServers: './.mcp.json',
      interface: interfaceMetadata
    },
    mcp: { mcpServers: mcp.mcpServers }
  };
}

export function generateCompatibility({ check = false } = {}) {
  const output = renderCompatibility(readJson('plugin.json'), readJson('mcp.json'));
  if (check) {
    const current = { plugin: readJson('.codex-plugin/plugin.json'), mcp: readJson('.mcp.json') };
    if (JSON.stringify(current) !== JSON.stringify(output)) throw new Error('OpenAI/Codex compatibility files are stale; run npm run generate.');
  } else {
    writeJson('.codex-plugin/plugin.json', output.plugin);
    writeJson('.mcp.json', output.mcp);
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  generateCompatibility({ check: process.argv.includes('--check') });
}
