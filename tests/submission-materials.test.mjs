import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertSanitized, deriveCandidate, validateSubmissionMaterials } from '../scripts/validate-submission-materials.mjs';

test('submission cards are blocked owner preflight maps derived from canonical sources', () => {
  const status = validateSubmissionMaterials();
  assert.equal(status.marketplaceState, 'non-submitted');
  assert.deepEqual(status.candidate.caseIds, ['P1', 'P2', 'P3', 'P4', 'P5', 'N1', 'N2', 'N3']);
  assert.equal(status.cards.length, 3);
  for (const card of status.cards) {
    assert.equal(card.status, 'non-submitted');
    assert.equal(card.result.status, 'blocked');
    assert.ok(card.why && card.fields.length && card.sharedData.length && card.recovery);
  }
  const [openai, cursor, anthropic] = status.cards;
  assert.equal(openai.pageOrSourceBlocker.kind, 'verified-page');
  assert.match(openai.pageOrSourceBlocker.source, /^https:\/\/developers\.openai\.com\//);
  assert.equal(cursor.pageOrSourceBlocker.source, 'https://cursor.com/marketplace/publish');
  assert.match(cursor.fields[0].reason, /Unverified official source/);
  assert.equal(openai.fields.find((field) => field.name === 'Apps Management write access').status, 'delegable-prerequisite');
  assert.equal(anthropic.fields.find((field) => field.name.includes('directory management access')).status, 'delegable-prerequisite');
  assert.deepEqual(anthropic.fields.filter((field) => field.source).map((field) => field.source), ['https://claude.ai/admin-settings/directory/submissions/plugins/new', 'https://platform.claude.com/plugins/submit']);
  assert.equal(deriveCandidate().name, 'voicedot');
  const preflight = JSON.parse(readFileSync(resolve(import.meta.dirname, '../submission/preflight.json'), 'utf8'));
  assert.equal(preflight.canonicalSources.inventory, 'dist/voicedot-agent-plugin-${plugin.version}.files.json');
  assert.equal(status.candidate.version, JSON.parse(readFileSync(resolve(import.meta.dirname, '../plugin.json'), 'utf8')).version);
});

test('submission boundary scan rejects sensitive, local, customer, marker, and unsupported-status content', () => {
  const unsafeValues = [
    ['api', '_key=abcdefghijk'].join(''),
    ['Author', 'ization: Bearer abcdefghijk'].join(''),
    ['https://local', 'host/portal'].join(''),
    ['/', 'Users/example'].join(''),
    ['fixture', '-marker-abcd'].join(''),
    ['customer', '_id=123'].join(''),
    'status: approved',
  ];
  for (const unsafe of unsafeValues) {
    assert.throws(() => assertSanitized(unsafe), /unsafe/);
  }
});
