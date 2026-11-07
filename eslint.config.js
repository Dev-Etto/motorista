const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FEATURES = fs
  .readdirSync(path.join(__dirname, 'src/features'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const featureZones = FEATURES.map((feature) => ({
  target: `./src/features/${feature}`,
  from: './src/features',
  except: [`./${feature}`, ...FEATURES.filter((other) => other !== feature).map((other) => `./${other}/index.ts`)],
  message: 'Importe outra funcionalidade só pelo index.ts dela.',
}));

const layerZones = [
  {
    target: './src/domain',
    from: ['./src/app', './src/application', './src/data', './src/features', './src/shared/hooks', './src/shared/platform', './src/shared/ui'],
    message: 'O domínio não conhece app, dados, telas nem efeitos.',
  },
  {
    target: './src/shared',
    from: ['./src/app', './src/application', './src/data', './src/domain', './src/features'],
    message: 'shared não conhece as camadas de cima.',
  },
  { target: './src/data', from: ['./src/app', './src/application', './src/features'], message: 'Dados não conhecem telas nem orquestração.' },
  { target: './src/application', from: ['./src/app', './src/features'], message: 'A orquestração não conhece telas.' },
];

const SIDE_EFFECT_MODULES = ['react', 'react-native', 'expo-*', '@modules/*', '@react-native-*'];
const TEST_FILES = ['**/__tests__/**'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', '**/build/**'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'no-else-return': ['error', { allowElseIf: false }],
      'max-depth': ['error', 2],
      'no-restricted-syntax': [
        'error',
        { selector: 'IfStatement[alternate]', message: 'Use early return no lugar de else.' },
        { selector: 'IfStatement > BlockStatement > IfStatement', message: 'Evite if dentro de if: use early return.' },
        { selector: 'IfStatement > IfStatement.consequent', message: 'Evite if dentro de if: use early return.' },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'never',
        },
      ],
      'import/no-restricted-paths': ['error', { zones: [...layerZones, ...featureZones] }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'expo-notifications', message: 'Use shared/platform/notifications.' },
            { name: 'expo-location', message: 'Use shared/platform/location.' },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    files: ['src/shared/platform/**', ...TEST_FILES],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: TEST_FILES,
    rules: { 'import/no-restricted-paths': 'off' },
  },
  {
    files: ['src/features/**/*.tsx'],
    ignores: TEST_FILES,
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/data/*'], message: 'Componentes acessam dados pelo hook da funcionalidade.' }] },
      ],
    },
  },
  {
    files: ['src/domain/**', 'src/shared/utils/**'],
    ignores: TEST_FILES,
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [{ group: SIDE_EFFECT_MODULES, message: 'domain e shared/utils são funções puras, sem React nem Expo.' }] },
      ],
    },
  },
]);
