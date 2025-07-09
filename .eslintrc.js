module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'plugin:testing-library/react',
    'plugin:jsx-a11y/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'jest',
    'testing-library',
    'jsx-a11y',
    'react-hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-duplicate-imports': 'error',
    
    // React rules
    'react/prop-types': 'off', // Disable prop-types as we're assuming you might use TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Jest and Testing Library rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'testing-library/await-async-queries': 'error',
    'testing-library/no-await-sync-queries': 'error',
    'testing-library/no-debugging-utils': 'warn',
    'testing-library/prefer-screen-queries': 'warn',
    
    // Accessibility rules
    'jsx-a11y/anchor-is-valid': 'warn',
  },
  overrides: [
    {
      // Specific rules for test files
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      rules: {
        'no-console': 'off',
        'jest/expect-expect': 'error',
        'jest/no-commented-out-tests': 'warn',
        'jest/no-conditional-expect': 'error',
      },
    },
  ],
};
