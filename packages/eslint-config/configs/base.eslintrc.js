module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 6,
        ecmaFeatures: {
            jsx: true
        }
    },
    plugins: ['@typescript-eslint', 'header', 'import', 'no-null', 'chai-friendly', 'deprecation'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
    ],
    env: {
        browser: true,
        mocha: true,
        es6: true
    },
    ignorePatterns: ['node_modules', '*.d.ts']
};
