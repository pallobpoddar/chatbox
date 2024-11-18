module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    projects: [
      '<rootDir>/conversation',
      '<rootDir>/shared',
      '<rootDir>/support',
      '<rootDir>/webhooks',
    ],
    testMatch: ['**/*.test.ts'],
    // moduleNameMapper: {
    //     '^mongoose$': '<rootDir>/**/src/__mocks__/mongoose.ts',  // Adjust path accordingly
    //   },
  };