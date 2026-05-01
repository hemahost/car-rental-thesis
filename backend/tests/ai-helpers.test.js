const test = require('node:test');
const assert = require('node:assert/strict');

const {
  maskApiKey,
  parseNumberOrNull,
  normalizeCarType,
  normalizeFeatures,
  normalizeDateOnly,
  getDurationDaysFromDates,
  normalizeExtractedFilters,
  formatCarLabel,
  formatCarDetails,
  buildFastRecommendation,
  withTimeout,
} = require('../dist/services/ai.service.js');

const sampleCar = {
  id: '1',
  brand: 'BMW',
  model: 'X5',
  type: 'SUV',
  pricePerDay: 120,
  imageUrl: null,
  description: 'Luxury SUV',
  city: 'Budapest',
  seats: 5,
  transmission: 'Automatic',
  fuelType: 'Diesel',
  year: 2023,
  horsepower: 335,
  mileageKm: 16400,
  color: 'White',
};

test('maskApiKey keeps only the edges of long keys', () => {
  assert.equal(maskApiKey('abcdefghijklmnop'), 'abcdefg...mnop');
});

test('maskApiKey fully masks very short keys', () => {
  assert.equal(maskApiKey('short-key'), '***masked***');
});

test('parseNumberOrNull parses valid numbers and strings', () => {
  assert.equal(parseNumberOrNull(12), 12);
  assert.equal(parseNumberOrNull('15.5'), 15.5);
});

test('parseNumberOrNull rejects invalid values', () => {
  assert.equal(parseNumberOrNull('abc'), null);
  assert.equal(parseNumberOrNull(undefined), null);
});

test('normalizeCarType accepts supported values case-insensitively', () => {
  assert.equal(normalizeCarType('SUV'), 'suv');
  assert.equal(normalizeCarType('Electric'), 'electric');
});

test('normalizeCarType rejects unsupported values', () => {
  assert.equal(normalizeCarType('truck'), null);
  assert.equal(normalizeCarType(null), null);
});

test('normalizeFeatures normalizes and deduplicates feature arrays', () => {
  assert.deepEqual(normalizeFeatures([' GPS ', 'gps', 'Sunroof']), ['gps', 'sunroof']);
});

test('normalizeFeatures returns null for invalid input', () => {
  assert.equal(normalizeFeatures('gps'), null);
});

test('normalizeDateOnly accepts valid date-only strings', () => {
  assert.equal(normalizeDateOnly('2026-05-10'), '2026-05-10');
  assert.equal(normalizeDateOnly('2026-02-30'), null);
  assert.equal(normalizeDateOnly('May 10'), null);
});

test('getDurationDaysFromDates calculates date ranges', () => {
  assert.equal(getDurationDaysFromDates('2026-05-10', '2026-05-15'), 5);
  assert.equal(getDurationDaysFromDates('2026-05-15', '2026-05-10'), null);
});

test('normalizeExtractedFilters converts raw model output into normalized filters', () => {
  const result = normalizeExtractedFilters({
    isCarRentalQuery: true,
    carType: 'SUV',
    minPrice: '50',
    maxPrice: 200,
    features: ['GPS'],
    durationDays: '3',
    pickupDate: '2026-05-10',
    returnDate: '2026-05-15',
    sortByPrice: 'desc',
    location: 'Budapest',
    brand: 'BMW',
    model: 'X5',
    minSeats: '4.1',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    yearMin: '2020',
    yearMax: '2024',
    minHorsepower: '250',
    maxHorsepower: '400',
    minMileageKm: '10000',
    maxMileageKm: '50000',
    color: 'White',
  });

  assert.deepEqual(result, {
    isCarRentalQuery: true,
    carType: 'suv',
    minPrice: 50,
    maxPrice: 200,
    features: ['gps'],
    durationDays: 5,
    pickupDate: '2026-05-10',
    returnDate: '2026-05-15',
    sortByPrice: 'desc',
    location: 'Budapest',
    brand: 'BMW',
    model: 'X5',
    minSeats: 5,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    yearMin: 2020,
    yearMax: 2024,
    minHorsepower: 250,
    maxHorsepower: 400,
    minMileageKm: 10000,
    maxMileageKm: 50000,
    color: 'White',
  });
});

test('formatCarLabel joins brand and model', () => {
  assert.equal(formatCarLabel(sampleCar), 'BMW X5');
});

test('formatCarDetails includes the available detail fields', () => {
  const text = formatCarDetails(sampleCar);
  assert.match(text, /5 seats/);
  assert.match(text, /Automatic/);
  assert.match(text, /335 hp/);
  assert.match(text, /16,400 km/);
  assert.match(text, /Budapest/);
});

test('buildFastRecommendation returns fallback text when no cars match', () => {
  const text = buildFastRecommendation([], 2);
  assert.match(text, /I couldn't find a matching car right now/);
});

test('buildFastRecommendation formats a single best match', () => {
  const text = buildFastRecommendation([sampleCar], 2, { minSeats: 5 });
  assert.match(text, /Best match: BMW X5/);
  assert.match(text, /about \$240 total/);
  assert.match(text, /I checked seats/);
});

test('buildFastRecommendation includes alternatives when available', () => {
  const other = { ...sampleCar, id: '2', brand: 'Audi', model: 'Q7', pricePerDay: 130 };
  const text = buildFastRecommendation([sampleCar, other], 1);
  assert.match(text, /Alternatives:/);
  assert.match(text, /Audi Q7/);
});

test('withTimeout resolves the original promise when it finishes in time', async () => {
  const result = await withTimeout(Promise.resolve('ok'), 50, () => 'fallback');
  assert.equal(result, 'ok');
});

test('withTimeout falls back when the promise takes too long', async () => {
  const delayed = new Promise((resolve) => setTimeout(() => resolve('late'), 30));
  const result = await withTimeout(delayed, 5, () => 'fallback');
  assert.equal(result, 'fallback');
});
