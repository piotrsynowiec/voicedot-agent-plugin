import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'reviewer/review-catalog-v1.json'), 'utf8'));

test('public reviewer catalog has the exact synthetic P1-P5/N1-N3 contract', () => {
  assert.equal(catalog.syntheticOnly, true);
  assert.deepEqual(catalog.cases.map(({ id }) => id), ['P1', 'P2', 'P3', 'P4', 'P5', 'N1', 'N2', 'N3']);
  for (const item of catalog.cases) {
    assert.deepEqual(Object.keys(item), ['id', 'projection', 'outcome', 'readOnly']);
    assert.equal(item.readOnly, true);
    assert.ok(item.projection && item.outcome);
  }
  assert.match(readFileSync(resolve(root, 'reviewer/README.md'), 'utf8'), /skills\/review-voicedot-feedback\/SKILL\.md/);
  const text = JSON.stringify(catalog).toLowerCase();
  for (const forbidden of ['@', 'bearer ', 'password', 'mcp.voicedot.ai', '/users/']) assert.ok(!text.includes(forbidden));
});
