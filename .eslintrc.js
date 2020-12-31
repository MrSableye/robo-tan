module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-typescript/base',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'import/order': ['error', {
      alphabetize: {
        order: 'desc',
        caseInsensitive: true,
      },
    }],
    'import/prefer-default-export': 'off',
  },
};
