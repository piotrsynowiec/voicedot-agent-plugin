import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const expectedCatalogIds = ['P1', 'P2', 'P3', 'P4', 'P5', 'N1', 'N2', 'N3'];
const fail = (message) => { throw new Error(message); };
const parse = (path, repoRoot = root) => JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8'));

const command = (args, repoRoot = root) => {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
};

function packageGatesPass(repoRoot) {
  try {
    execFileSync(process.execPath, ['scripts/validate-package.mjs'], { cwd: repoRoot, stdio: 'ignore' });
    execFileSync(process.execPath, ['scripts/package.mjs', '--check'], { cwd: repoRoot, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function evaluateReleaseCandidate(evidence) {
  const localBlockers = [];
  if (!evidence.clean) localBlockers.push('worktree_dirty');
  if (!evidence.head) localBlockers.push('head_unavailable');
  if (evidence.tag !== `v${evidence.version}`) localBlockers.push('version_tag_missing_or_mismatched');
  if (!evidence.annotatedTag) localBlockers.push('annotated_version_tag_required');
  if (!evidence.tagResolvesToHead) localBlockers.push('version_tag_not_at_head');
  for (const gate of ['archive', 'inventory', 'digest', 'digestMatchesArchive', 'manifests', 'generatedAdapter', 'catalog', 'packageGates']) {
    if (!evidence[gate]) localBlockers.push(`${gate}_invalid_or_stale`);
  }
  return { status: 'blocked', marketplaceReadiness: 'blocked', localProvenance: localBlockers.length ? 'blocked' : 'passes-local-checks-only', blockers: [...localBlockers, 'remote_immutable_candidate_unproven'], evidence };
}

export function collectReleaseCandidateEvidence({ repoRoot = root, run = command } = {}) {
  const plugin = parse('plugin.json', repoRoot);
  const packageName = `voicedot-agent-plugin-${plugin.version}`;
  const inventoryName = `${packageName}.files.json`;
  const archiveName = `${packageName}.tar.gz`;
  const digestName = `${packageName}.sha256`;
  const inventory = parse(`dist/${inventoryName}`, repoRoot);
  const archivePath = resolve(repoRoot, `dist/${archiveName}`);
  const digestPath = resolve(repoRoot, `dist/${digestName}`);
  const catalog = parse('reviewer/review-catalog-v1.json', repoRoot);
  const head = run(['rev-parse', 'HEAD'], repoRoot);
  const tag = run(['describe', '--tags', '--exact-match', 'HEAD'], repoRoot);
  const tagRef = `refs/tags/v${plugin.version}`;
  const tagObjectType = run(['cat-file', '-t', tagRef], repoRoot);
  const tagResolvedCommit = run(['rev-parse', `${tagRef}^{}`], repoRoot);
  const archive = existsSync(archivePath) ? readFileSync(archivePath) : null;
  const archiveSha256 = archive && createHash('sha256').update(archive).digest('hex');
  const digest = existsSync(digestPath) ? readFileSync(digestPath, 'utf8') : '';
  const clean = run(['status', '--porcelain'], repoRoot) === '';
  const packageGates = packageGatesPass(repoRoot);
  return {
    clean,
    head,
    tag,
    annotatedTag: tagObjectType === 'tag',
    tagResolvesToHead: Boolean(head && tagResolvedCommit && tagResolvedCommit === head),
    version: plugin.version,
    artifactNames: { packageName, inventoryName, archiveName, digestName },
    archive: Boolean(archive) && inventory.package === packageName,
    inventory: Array.isArray(inventory.files) && inventory.files.every((entry) => entry.path && entry.sha256 && Number.isInteger(entry.bytes)),
    digest: digest === (archiveSha256 ? `${archiveSha256}  ${archiveName}\n` : ''),
    digestMatchesArchive: Boolean(archiveSha256) && digest.startsWith(archiveSha256),
    manifests: plugin.name === 'voicedot' && existsSync(resolve(repoRoot, 'mcp.json')),
    generatedAdapter: existsSync(resolve(repoRoot, '.codex-plugin/plugin.json')) && existsSync(resolve(repoRoot, '.mcp.json')),
    catalog: JSON.stringify(catalog.cases.map(({ id }) => id)) === JSON.stringify(expectedCatalogIds),
    packageGates,
  };
}

export function verifyReleaseCandidate(options) {
  let evidence;
  try {
    evidence = collectReleaseCandidateEvidence(options);
  } catch (error) {
    return { status: 'blocked', marketplaceReadiness: 'blocked', localProvenance: 'blocked', blockers: ['repository_state_unavailable', 'remote_immutable_candidate_unproven'], evidence: { message: error.message } };
  }
  return evaluateReleaseCandidate(evidence);
}

export function printStatus() {
  process.stdout.write(`${JSON.stringify(verifyReleaseCandidate())}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) printStatus();
