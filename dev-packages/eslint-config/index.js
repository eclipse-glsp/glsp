const baseConfig = require('./configs/base');
const warningsConfig = require('./configs/warnings');
const errorsConfig = require('./configs/errors');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
    // Global ignores (replaces ignorePatterns + .eslintignore)
    {
        ignores: ['**/{css,node_modules,lib,dist}', '**/*.d.ts', '**/*.map']
    },
    // Base config (parser, plugins, recommended presets)
    ...baseConfig,
    // Warning-level rules
    ...warningsConfig,
    // Error-level rules
    ...errorsConfig,
    // Prettier (must be last — disables conflicting formatting rules)
    eslintConfigPrettier
];
