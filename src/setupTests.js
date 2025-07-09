// jest-dom adds custom jest matchers for asserting on DOM nodes.
// Try to import if available, otherwise skip
try {
  require('@testing-library/jest-dom');
} catch (e) {
  console.warn('@testing-library/jest-dom is not installed. Some matchers may not be available.');
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
