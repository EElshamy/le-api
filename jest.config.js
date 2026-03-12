module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleDirectories: ['node_modules', '@src'],
  rootDir: './',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  transformIgnorePatterns: ['/node_modules/'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  collectCoverage: false,
  verbose: true,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/test/before-test-run.ts'],
  displayName: {
    name: 'Classes Hub',
    color: 'blue'
  },
  // https://github.com/facebook/jest/issues/11404#issuecomment-1003328922
  testRunner: 'jest-jasmine2'

  // globalSetup: '<rootDir>/test/setup.ts',
  // globalTeardown: '<rootDir>/test/teardown.ts',
};
