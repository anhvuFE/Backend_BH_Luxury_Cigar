const mongoose = require('mongoose');

// Increase timeout for slower operations
jest.setTimeout(30000);

// Setup test database connection
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db';

  try {
    await mongoose.connect(testDbUri);
    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection error:', error);
    process.exit(1);
  }
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};