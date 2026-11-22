import test from 'node:test';
import assert from 'node:assert/strict';
import {generateQrMatrix, QR_SIZE, validateWaitlistEmail} from './qrMatrix';

test('generateQrMatrix produces a deterministic 21x21 matrix with finder corners', () => {
  const a = generateQrMatrix('lagos-live-2026');
  const b = generateQrMatrix('lagos-live-2026');
  const c = generateQrMatrix('mama-tolu-60');

  assert.equal(a.length, QR_SIZE);
  assert.equal(a[0].length, QR_SIZE);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);

  // Top-left 7x7 finder outer border and center 3x3 block
  assert.equal(a[0][0], true);
  assert.equal(a[1][1], false);
  assert.equal(a[3][3], true);
  assert.equal(a[6][6], true);

  // Top-right and bottom-left finder corners
  assert.equal(a[0][QR_SIZE - 1], true);
  assert.equal(a[QR_SIZE - 1][0], true);
});

test('validateWaitlistEmail rejects empty and malformed emails and normalizes valid ones', () => {
  assert.equal(validateWaitlistEmail('   ').valid, false);
  assert.equal(validateWaitlistEmail('not-an-email').valid, false);
  assert.equal(validateWaitlistEmail('ada@domain').valid, false);

  const ok = validateWaitlistEmail('  Tolu.Adebayo@Example.COM ');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalizedEmail, 'tolu.adebayo@example.com');
});
