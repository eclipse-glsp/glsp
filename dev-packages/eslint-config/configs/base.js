const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const importX = require('eslint-plugin-import-x');
const header = require('@tony.ganchev/eslint-plugin-header');
const noNull = require('eslint-plugin-no-null');
const stylistic = require('@stylistic/eslint-plugin');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    {
        name: '@eclipse-glsp/base',
        languageOptions: {
            ecmaVersion: 6,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true }
            },
            globals: {
                ...globals.browser,
                ...globals.es2015
            }
        },
        plugins: {
            header: header,
            'no-null': noNull,
            '@stylistic': stylistic
        }
    }
];
