const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseDateOnly,
  getBookingDateValidation,
} = require('../dist/routes/bookings.js');

test('parseDateOnly creates a midnight date from YYYY-MM-DD input', () => {
  const date = parseDateOnly('2099-05-20');

  assert.equal(date.getFullYear(), 2099);
  assert.equal(date.getMonth(), 4);
  assert.equal(date.getDate(), 20);
  assert.equal(date.getHours(), 0);
});

test('booking validation rejects invalid date input', () => {
  const result = getBookingDateValidation(new Date('invalid'), new Date('2099-05-20'));
  assert.equal(result, 'Invalid date format');
});

test('booking validation rejects start date after end date', () => {
  const result = getBookingDateValidation(
    new Date('2099-05-22T00:00:00'),
    new Date('2099-05-20T00:00:00')
  );

  assert.equal(result, 'Start date must be before end date');
});

test('booking validation rejects rentals longer than thirty days', () => {
  const result = getBookingDateValidation(
    new Date('2099-05-01T00:00:00'),
    new Date('2099-06-05T00:00:00')
  );

  assert.equal(result, 'Bookings cannot be longer than 30 days');
});

test('booking validation accepts a normal future booking range', () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 7);

  const end = new Date(start);
  end.setDate(end.getDate() + 3);

  const result = getBookingDateValidation(
    start,
    end
  );

  assert.equal(result, null);
});
