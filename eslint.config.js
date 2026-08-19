const maintainabilityRules = {
  complexity: ['warn', 15],
  'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true, IIFEs: true }],
};

export default [
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...maintainabilityRules,
      'constructor-super': 'error',
      'for-direction': 'error',
      'getter-return': 'error',
      'no-async-promise-executor': 'error',
      'no-class-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-obj-calls': 'error',
      'no-promise-executor-return': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unused-private-class-members': 'error',
      'no-useless-backreference': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
    },
  },
  {
    files: ['test/**/*.js', 'e2e/**/*.js'],
    rules: {
      complexity: ['warn', 20],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true }],
    },
  },
];
