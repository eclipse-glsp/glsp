module.exports = {
    rules: {
        // https://eslint.org/docs/rules/
        'brace-style': 'off',
        'comma-dangle': 'warn',
        curly: 'warn',
        'eol-last': 'warn',
        'no-invalid-this': 'warn',
        'no-new-wrappers': 'warn',
        'no-return-await': 'warn',
        'no-redeclare': 'off',
        'no-shadow': [
            'warn',
            {
                hoist: 'all'
            }
        ],
        'no-multiple-empty-lines': [
            'warn',
            {
                max: 1
            }
        ],
        'no-trailing-spaces': 'warn',
        'no-void': 'warn',
        'prefer-const': [
            'warn',
            {
                destructuring: 'all'
            }
        ],
        'prefer-object-spread': 'warn',
        radix: 'warn',
        'spaced-comment': [
            'warn',
            'always',
            {
                exceptions: ['*', '+', '-', '/', '!']
            }
        ],
        'space-before-function-paren': [
            'warn',
            {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }
        ],
        // Stylistic Issues
        'max-len': [
            'warn',
            {
                code: 140
            }
        ],
        'use-isnan': 'warn',
        'arrow-parens': ['warn', 'as-needed'],

        // @typescript-eslint/eslint-plugin
        '@typescript-eslint/semi': ['warn', 'always'],
        '@typescript-eslint/quotes': [
            'warn',
            'single',
            {
                avoidEscape: true
            }
        ],
        '@typescript-eslint/explicit-function-return-type': [
            'warn',
            {
                allowExpressions: true
            }
        ],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/type-annotation-spacing': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-this-alias': 'off',

        /// eslint-plugin-deprecation plugin
        'deprecation/deprecation': 'warn'
    }
};
