const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BOOKING_HOLD_MINUTES,
  getPendingBookingExpiryCutoff,
  isPendingBookingExpired,
} = require('../dist/utils/bookingExpiration.js');

test('booking hold duration matches the configured policy', () => {
  assert.equal(BOOKING_HOLD_MINUTES, 3);
});

test('expiry cutoff is in the past', () => {
  const cutoff = getPendingBookingExpiryCutoff();
  assert.ok(cutoff.getTime() < Date.now());
});

test('pending unpaid bookings older than cutoff are expired', () => {
  const createdAt = new Date(Date.now() - (BOOKING_HOLD_MINUTES + 1) * 60 * 1000);

  assert.equal(
    isPendingBookingExpired({
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      createdAt,
    }),
    true
  );
});

test('paid pending bookings are not treated as expired', () => {
  const createdAt = new Date(Date.now() - (BOOKING_HOLD_MINUTES + 1) * 60 * 1000);

  assert.equal(
    isPendingBookingExpired({
      status: 'PENDING',
      paymentStatus: 'PAID',
      createdAt,
    }),
    false
  );
});

test('non-pending bookings are not treated as expired', () => {
  const createdAt = new Date(Date.now() - (BOOKING_HOLD_MINUTES + 1) * 60 * 1000);

  assert.equal(
    isPendingBookingExpired({
      status: 'CONFIRMED',
      paymentStatus: 'UNPAID',
      createdAt,
    }),
    false
  );
});
