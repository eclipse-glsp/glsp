/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: '@eclipse-glsp',
    ignorePatterns: ['**/{node_modules,lib}', '**/.eslintrc.js'],

    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.eslint.json'
    }
};
