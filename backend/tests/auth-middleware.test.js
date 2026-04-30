const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { authenticate, requireAdmin } = require('../dist/middleware/auth.js');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('authenticate rejects requests without an authorization header', () => {
  const req = { headers: {} };
  const res = createRes();
  let called = false;

  authenticate(req, res, () => { called = true; });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.message, 'No token provided');
});

test('authenticate rejects malformed bearer tokens', () => {
  const req = { headers: { authorization: 'Basic abc' } };
  const res = createRes();

  authenticate(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.message, 'No token provided');
});

test('authenticate populates user information for valid tokens', () => {
  const token = jwt.sign({ userId: 'u1', role: 'ADMIN' }, 'fallback-secret');
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createRes();
  let called = false;

  authenticate(req, res, () => { called = true; });

  assert.equal(called, true);
  assert.equal(req.userId, 'u1');
  assert.equal(req.userRole, 'ADMIN');
});

test('authenticate rejects invalid tokens', () => {
  const req = { headers: { authorization: 'Bearer invalid-token' } };
  const res = createRes();

  authenticate(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.message, 'Invalid or expired token');
});

test('requireAdmin rejects non-admin users', () => {
  const req = { userRole: 'USER' };
  const res = createRes();
  let called = false;

  requireAdmin(req, res, () => { called = true; });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.message, 'Admin access required');
});

test('requireAdmin allows admin users', () => {
  const req = { userRole: 'ADMIN' };
  const res = createRes();
  let called = false;

  requireAdmin(req, res, () => { called = true; });

  assert.equal(called, true);
});
