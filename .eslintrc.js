module.exports = {
  extends: [
    'standard-with-typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    project: './tsconfig.json'
  },
  ignorePatterns: ['public/**/*', '.github/**/*'],
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/return-await': 'off'
  }
}
