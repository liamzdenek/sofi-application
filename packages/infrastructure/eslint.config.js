const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../eslint.config.js');
const js = require('@eslint/js');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/infrastructure/**/*.ts',
      'packages/infrastructure/**/*.tsx',
      'packages/infrastructure/**/*.js',
      'packages/infrastructure/**/*.jsx',
    ],
    rules: {},
  },
  ...compat.config({ extends: ['plugin:@nx/typescript'] }).map((config) => ({
    ...config,
    files: [
      'packages/infrastructure/**/*.ts',
      'packages/infrastructure/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  })),
  ...compat.config({ extends: ['plugin:@nx/javascript'] }).map((config) => ({
    ...config,
    files: [
      'packages/infrastructure/**/*.js',
      'packages/infrastructure/**/*.jsx',
    ],
    rules: {},
  })),
];