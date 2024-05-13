/* eslint-disable header/header */
/* eslint-disable no-undef */
/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: '@eclipse-glsp',
    rules: {
        // turn import issues off as eslint cannot handle ES modules easily
        'import/no-unresolved': 'off'
    }
};
