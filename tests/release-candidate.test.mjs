import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateReleaseCandidate, verifyReleaseCandidate } from '../scripts/verify-release-candidate.mjs';

const validEvidence = {
  clean: true, head: 'a'.repeat(40), tag: 'v0.1.0', annotatedTag: true, tagResolvesToHead: true, version: '0.1.0',
  archive: true, inventory: true, digest: true, digestMatchesArchive: true, manifests: true, generatedAdapter: true, catalog: true, packageGates: true,
};

test('local provenance remains non-marketplace-ready even when every synthetic local check passes', () => {
  const localPass = evaluateReleaseCandidate(validEvidence);
  assert.equal(localPass.status, 'blocked');
  assert.equal(localPass.marketplaceReadiness, 'blocked');
  assert.equal(localPass.localProvenance, 'passes-local-checks-only');
  assert.deepEqual(localPass.blockers, ['remote_immutable_candidate_unproven']);
  for (const [field, expected] of [['clean', 'worktree_dirty'], ['tag', 'version_tag_missing_or_mismatched'], ['annotatedTag', 'annotated_version_tag_required'], ['tagResolvesToHead', 'version_tag_not_at_head'], ['archive', 'archive_invalid_or_stale'], ['inventory', 'inventory_invalid_or_stale'], ['digest', 'digest_invalid_or_stale'], ['digestMatchesArchive', 'digestMatchesArchive_invalid_or_stale'], ['generatedAdapter', 'generatedAdapter_invalid_or_stale'], ['catalog', 'catalog_invalid_or_stale'], ['packageGates', 'packageGates_invalid_or_stale']]) {
    const value = field === 'tag' ? 'v9.9.9' : false;
    assert.ok(evaluateReleaseCandidate({ ...validEvidence, [field]: value }).blockers.includes(expected));
  }
});

test('actual repository status remains a blocked non-submission candidate without remote immutability', () => {
  const status = verifyReleaseCandidate();
  assert.equal(status.status, 'blocked');
  assert.equal(status.marketplaceReadiness, 'blocked');
  assert.ok(status.blockers.includes('version_tag_missing_or_mismatched'));
  assert.ok(status.blockers.includes('remote_immutable_candidate_unproven'));
});
