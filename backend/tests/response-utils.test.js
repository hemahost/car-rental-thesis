const test = require('node:test');
const assert = require('node:assert/strict');

const { sendSuccess, sendError } = require('../dist/utils/response.js');

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

test('sendSuccess returns success true with default status 200', () => {
  const res = createRes();
  sendSuccess(res, { user: { id: '1' } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, user: { id: '1' } });
});

test('sendSuccess supports custom status codes', () => {
  const res = createRes();
  sendSuccess(res, { booking: { id: 'b1' } }, 201);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { success: true, booking: { id: 'b1' } });
});

test('sendError returns error wrapper with default status 400', () => {
  const res = createRes();
  sendError(res, 'Bad request');
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, error: { message: 'Bad request' } });
});

test('sendError supports custom status codes', () => {
  const res = createRes();
  sendError(res, 'Not found', 404);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, error: { message: 'Not found' } });
});
