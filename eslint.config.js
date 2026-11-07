const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const i18next = require('eslint-plugin-i18next');

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

const SIDE_EFFECT_MODULES = ['react', 'react-native', 'expo-*', '@modules/*', '@react-native-*', 'i18next', 'react-i18next', '@shared/i18n', '@shared/i18n/*'];

const ALIAS_MESSAGE = 'Importe pelo alias da camada, como @shared/utils/money. Caminho relativo só na mesma pasta.';

const BASE_SYNTAX = [
  { selector: 'IfStatement[alternate]', message: 'Use early return no lugar de else.' },
  { selector: 'IfStatement > BlockStatement > IfStatement', message: 'Evite if dentro de if: use early return.' },
  { selector: 'IfStatement > IfStatement.consequent', message: 'Evite if dentro de if: use early return.' },
  { selector: 'ImportDeclaration[source.value=/^\\.\\.(\\/|$)|^@\\//]', message: ALIAS_MESSAGE },
  { selector: ':matches(ExportNamedDeclaration, ExportAllDeclaration)[source.value=/^\\.\\.(\\/|$)|^@\\//]', message: ALIAS_MESSAGE },
  { selector: "CallExpression[callee.object.name='jest'] > Literal[value=/^\\.\\.(\\/|$)|^@\\//]", message: ALIAS_MESSAGE },
];

const PROSE = '/[A-Za-zÀ-ÿ]{2,} [A-Za-zÀ-ÿ]{2,}/';
const REGIONAL_MESSAGE = 'Moeda, locale e casas decimais vêm do formatador: use useFormat() ou currentFormat().';
const REGIONAL_SYNTAX = [
  { selector: 'Literal[value=/R\\$|^pt-BR$|^BRL$/]', message: REGIONAL_MESSAGE },
  { selector: 'TemplateElement[value.raw=/R\\$/]', message: REGIONAL_MESSAGE },
  { selector: 'JSXText[value=/R\\$/]', message: REGIONAL_MESSAGE },
  { selector: 'CallExpression[callee.property.name=/^(toFixed|toLocaleString|toLocaleDateString|toLocaleTimeString)$/]', message: REGIONAL_MESSAGE },
];
const REGIONAL_OWNERS = [
  'src/shared/i18n/**',
  'src/shared/utils/**',
  'src/domain/regional/**',
  'src/data/database/**',
  'src/features/copilot/useCopilotTests.ts',
];
const DOMAIN_TEXT_MESSAGE = 'O domínio devolve códigos e parâmetros. O texto fica nas traduções.';
const TEST_FILES = ['**/__tests__/**'];
const TEXT_PROPS = [
  'label',
  'title',
  'subtitle',
  'message',
  'hint',
  'placeholder',
  'actionLabel',
  'accessibilityLabel',
  'accessibilityHint',
  'text',
  'value',
  'caption',
  'description',
];

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
      'no-restricted-syntax': ['error', ...BASE_SYNTAX, ...REGIONAL_SYNTAX],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [{ pattern: '@{app,application,config,data,domain,features,shared,modules}/**', group: 'internal' }],
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
            { name: 'expo-localization', message: 'Use shared/platform/locale.' },
            { name: 'react-native', importNames: ['Alert'], message: 'Use showDialog ou confirmAction de @shared/ui/dialog, com a identidade visual do app.' },
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
        { patterns: [{ group: ['@data/*'], message: 'Componentes acessam dados pelo hook da funcionalidade.' }] },
      ],
    },
  },
  {
    files: ['src/domain/**', 'src/shared/utils/**'],
    ignores: TEST_FILES,
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [{ group: SIDE_EFFECT_MODULES, message: 'domain e shared/utils são funções puras, sem React, Expo nem traduções.' }] },
      ],
    },
  },
  {
    files: [...REGIONAL_OWNERS, 'modules/**', '*.js', '*.ts', ...TEST_FILES],
    rules: { 'no-restricted-syntax': ['error', ...BASE_SYNTAX] },
  },
  {
    files: ['src/domain/**'],
    ignores: [...TEST_FILES, 'src/domain/regional/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_SYNTAX,
        ...REGIONAL_SYNTAX,
        { selector: `Literal[value=${PROSE}]`, message: DOMAIN_TEXT_MESSAGE },
        { selector: `TemplateElement[value.raw=${PROSE}]`, message: DOMAIN_TEXT_MESSAGE },
      ],
    },
  },
  {
    files: ['src/features/**/*.tsx', 'src/shared/ui/**/*.tsx', 'src/app/**/*.tsx'],
    ignores: TEST_FILES,
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': { include: TEXT_PROPS },
          callees: { exclude: ['i18n(ext)?', 't\\w*', '(\\w+\\.)?bind', 'require'] },
          message: 'Texto visível vem das traduções: use t() com uma chave do namespace.',
        },
      ],
    },
  },
]);
