import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const submission = resolve(root, 'submission');
const ownerInputs = ['immutableCandidate', 'logo', 'website', 'supportUrl', 'privacyUrl', 'termsUrl', 'country', 'reviewerAccess', 'cleanClientEvidence', 'productionEvidence'];
const cardFiles = ['openai.json', 'cursor.json', 'anthropic.json'];
const parse = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const fail = (message) => { throw new Error(message); };

export function deriveCandidate() {
  const plugin = parse('plugin.json');
  const mcp = parse('mcp.json');
  const inventory = parse('dist/voicedot-agent-plugin-0.1.0.files.json');
  const catalog = parse('reviewer/review-catalog-v1.json');
  const archive = readFileSync(resolve(root, `dist/${inventory.package}.tar.gz`));
  return {
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    repository: plugin.repository,
    homepage: plugin.homepage,
    license: plugin.license,
    transport: mcp.mcpServers.voicedot.type,
    archiveSha256: createHash('sha256').update(archive).digest('hex'),
    inventoryPaths: inventory.files.map(({ path }) => path),
    caseIds: catalog.cases.map(({ id }) => id),
  };
}

export function assertSanitized(value, label = 'submission material') {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const patterns = [
    /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\s*[:=]\s*['"]?[A-Za-z0-9._-]{8,}/i,
    new RegExp(['author', 'ization\\s*[:=]\\s*bearer\\s+', '[A-Za-z0-9._-]{8,}'].join(''), 'i'),
    new RegExp(['plugin_', 'asdk_', 'app[\\w-]{8,}'].join(''), 'i'),
    /(?:customer|visitor)[_-]?(?:id|email)\s*[:=]\s*['"]?\S+/i,
    /(?:synthetic|fixture|test)[_-]?(?:marker|customer)[_-]?[a-z0-9]{4,}/i,
    new RegExp(['(?:file:\\/\\/|https?:\\/\\/)(?:local', 'host|127\\.0\\.0\\.1|0\\.0\\.0\\.0|10\\.\\d+\\.|192\\.168\\.|172\\.(?:1[6-9]|2\\d|3[01])\\.)'].join(''), 'i'),
    new RegExp(['(?:^|[\\s\'"`])(?:/', 'Users', '\\/|\\/home\\/|\\.\\.\\/|~\\/)'].join(''), 'm'),
    /(?<!non-)\b(?:ready|submitted|approved|published)\b/i,
  ];
  if (patterns.some((pattern) => pattern.test(text))) fail(`unsafe ${label}`);
}

function assertCard(card, filename) {
  if (card.status !== 'non-submitted') fail(`${filename} must remain non-submitted`);
  for (const key of ['platform', 'why', 'pageOrSourceBlocker', 'fields', 'sharedData', 'preApprovalChecks', 'result', 'recovery']) if (!(key in card)) fail(`${filename} missing ${key}`);
  if (!['verified-page', 'unverified-source-blocker'].includes(card.pageOrSourceBlocker.kind) || !card.pageOrSourceBlocker.source || !card.pageOrSourceBlocker.reason) fail(`${filename} has an invalid source record`);
  if (JSON.stringify(card.preApprovalChecks) !== JSON.stringify(ownerInputs)) fail(`${filename} must require every owner input`);
  if (card.result.status !== 'blocked') fail(`${filename} must be blocked`);
  assertSanitized(card, filename);
}

export function validateSubmissionMaterials() {
  const preflight = parse('submission/preflight.json');
  if (preflight.marketplaceState !== 'non-submitted' || JSON.stringify(preflight.requiredOwnerInputs) !== JSON.stringify(ownerInputs)) fail('preflight owner blockers are incomplete');
  for (const source of Object.values(preflight.canonicalSources)) if (!readFileSync(resolve(root, source))) fail(`canonical source is missing: ${source}`);
  assertSanitized(preflight, 'preflight.json');
  for (const filename of cardFiles) assertCard(parse(`submission/${filename}`), filename);
  const candidate = deriveCandidate();
  if (candidate.caseIds.join() !== 'P1,P2,P3,P4,P5,N1,N2,N3' || !candidate.inventoryPaths.includes('plugin.json')) fail('canonical candidate derivation is incomplete');
  return { marketplaceState: preflight.marketplaceState, blockers: ownerInputs, candidate, cards: cardFiles.map((filename) => parse(`submission/${filename}`)) };
}

export function printStatus() {
  const status = validateSubmissionMaterials();
  process.stdout.write(`${JSON.stringify(status)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) printStatus();
