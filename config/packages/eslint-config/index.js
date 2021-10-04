module.exports = require('./configs/base.eslintrc');
module.exports = require('./configs/errors.eslintrc');
module.exports = require('./configs/warnings.eslintrc');
/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: ['./configs/base.eslintrc', './configs/warnings.eslintrc', './configs/errors.eslintrc', 'prettier'],
    ignorePatterns: ['**/{css,node_modules,lib}'],
    root: true
};
