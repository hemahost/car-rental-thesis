const test = require('node:test');
const assert = require('node:assert/strict');

const { getPasswordPolicyError } = require('../dist/routes/auth.js');

test('accepts a strong password', () => {
  assert.equal(getPasswordPolicyError('Strong!Pass1'), null);
});

test('rejects passwords shorter than eight characters', () => {
  assert.equal(
    getPasswordPolicyError('S!a123'),
    'Password must be at least 8 characters long'
  );
});

test('rejects passwords without lowercase letters', () => {
  assert.equal(
    getPasswordPolicyError('STRONG!1'),
    'Password must include at least one lowercase letter'
  );
});

test('rejects passwords without uppercase letters', () => {
  assert.equal(
    getPasswordPolicyError('strong!1'),
    'Password must include at least one uppercase letter'
  );
});

test('rejects passwords without special characters', () => {
  assert.equal(
    getPasswordPolicyError('StrongPass1'),
    'Password must include at least one special character'
  );
});
