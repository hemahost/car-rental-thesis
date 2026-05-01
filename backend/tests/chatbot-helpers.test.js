const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeFilters,
  shouldUseExternalCarInfo,
  isLikelyCarOrRentalQuestion,
  isGreetingOrPleasantry,
  extractHorsepowerThreshold,
  extractMileageThreshold,
  extractColor,
  extractDateRange,
  isDateRangeInPast,
  uniqueCarsByModel,
} = require('../dist/services/chatbot.service.js');

test('normalizeFilters rounds and sanitizes extracted values', () => {
  const result = normalizeFilters({
    isCarRentalQuery: true,
    carType: 'suv',
    minPrice: -5,
    maxPrice: 120,
    features: ['gps'],
    durationDays: 2.4,
    pickupDate: '2026-05-10',
    returnDate: '2026-05-15',
    sortByPrice: 'asc',
    location: 'Budapest',
    brand: 'BMW',
    model: 'X5',
    minSeats: 6.1,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    yearMin: 2020.2,
    yearMax: 2024.8,
    minHorsepower: 250.2,
    maxHorsepower: 400.7,
    minMileageKm: 10000.1,
    maxMileageKm: 30000.9,
    color: 'Blue',
  });

  assert.deepEqual(result, {
    isCarRentalQuery: true,
    carType: 'suv',
    minPrice: null,
    maxPrice: 120,
    features: ['gps'],
    durationDays: 2.4,
    pickupDate: '2026-05-10',
    returnDate: '2026-05-15',
    sortByPrice: 'asc',
    location: 'Budapest',
    brand: 'BMW',
    model: 'X5',
    minSeats: 7,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    yearMin: 2020,
    yearMax: 2025,
    minHorsepower: 250,
    maxHorsepower: 401,
    minMileageKm: 10000,
    maxMileageKm: 30001,
    color: 'Blue',
  });
});

test('detects when a message needs external car specifications', () => {
  assert.equal(shouldUseExternalCarInfo('What is the horsepower of the BMW X5?'), true);
  assert.equal(shouldUseExternalCarInfo('I need a cheap SUV in Budapest'), false);
});

test('detects likely car rental questions and greetings', () => {
  assert.equal(isLikelyCarOrRentalQuestion('Do you have an electric car?'), true);
  assert.equal(isLikelyCarOrRentalQuestion('What is the capital of France?'), false);
  assert.equal(isGreetingOrPleasantry('Hello!'), true);
  assert.equal(isGreetingOrPleasantry('Need a blue sedan'), false);
});

test('extracts horsepower thresholds from natural language', () => {
  assert.deepEqual(extractHorsepowerThreshold('I need a car with more than 400 horsepower'), {
    minHorsepower: 400,
    maxHorsepower: null,
  });

  assert.deepEqual(extractHorsepowerThreshold('Show me cars under 200 hp'), {
    minHorsepower: null,
    maxHorsepower: 200,
  });
});

test('extracts mileage thresholds and low-mileage intent', () => {
  assert.deepEqual(extractMileageThreshold('Show me cars with less than 20000 km'), {
    minMileageKm: null,
    maxMileageKm: 20000,
  });

  assert.deepEqual(extractMileageThreshold('I want a low mileage car'), {
    minMileageKm: null,
    maxMileageKm: 25000,
  });
});

test('extracts supported colors from messages', () => {
  assert.equal(extractColor('Do you have a red car?'), 'Red');
  assert.equal(extractColor('I want a gray SUV'), 'Grey');
  assert.equal(extractColor('Need something premium'), null);
});

test('extracts exact rental date ranges from natural language', () => {
  const now = new Date('2026-05-01T12:00:00');

  assert.deepEqual(extractDateRange('I need a BMW from May 10 to May 15', now), {
    pickupDate: '2026-05-10',
    returnDate: '2026-05-15',
    durationDays: 5,
  });

  assert.deepEqual(extractDateRange('Need an SUV 2026-06-01 to 2026-06-04', now), {
    pickupDate: '2026-06-01',
    returnDate: '2026-06-04',
    durationDays: 3,
  });
});

test('detects exact date ranges in the past', () => {
  const now = new Date('2026-05-01T12:00:00');

  assert.deepEqual(extractDateRange('I need a BMW from April 10 to April 15', now), {
    pickupDate: '2026-04-10',
    returnDate: '2026-04-15',
    durationDays: 5,
  });

  assert.equal(isDateRangeInPast('2026-04-10', '2026-04-15', now), true);
  assert.equal(isDateRangeInPast('2026-05-01', '2026-05-03', now), false);
  assert.equal(isDateRangeInPast('2026-05-10', '2026-05-15', now), false);
});

test('removes duplicate recommendations by brand and model', () => {
  const cars = [
    { brand: 'BMW', model: 'X5' },
    { brand: 'BMW', model: 'X5' },
    { brand: 'Audi', model: 'Q7' },
  ].map((car, index) => ({
    id: String(index + 1),
    type: 'SUV',
    pricePerDay: 100,
    imageUrl: null,
    description: '',
    city: null,
    seats: null,
    transmission: null,
    fuelType: null,
    year: null,
    horsepower: null,
    mileageKm: null,
    color: null,
    ...car,
  }));

  const unique = uniqueCarsByModel(cars);

  assert.equal(unique.length, 2);
  assert.deepEqual(
    unique.map((car) => `${car.brand} ${car.model}`),
    ['BMW X5', 'Audi Q7']
  );
});
