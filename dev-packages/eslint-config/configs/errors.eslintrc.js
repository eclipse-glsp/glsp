const year = new Date().getFullYear();
module.exports = {
    rules: {
        // https://eslint.org/docs/rules/
        // Possible Errors
        'no-inner-declarations': 'off',
        // Best Practices
        eqeqeq: ['error', 'smart'],
        'guard-for-in': 'error',
        'no-caller': 'error',
        'no-eval': 'error',
        'no-restricted-imports': ['error', '..', '../index', '../..', '../../index', 'src'],
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unused-expressions': [
            'error',
            {
                allowShortCircuit: true,
                allowTernary: true
            }
        ],
        // Variables
        'no-unused-vars': 'off', // typescript-eslint rule activated instead
        'no-use-before-define': 'off', // typescript-eslint rule activated instead
        'no-underscore-dangle': 'off',
        quotes: 'off', // typescript-eslint rule activated instead
        'one-var': ['error', 'never'],
        // ECMAScript6
        'arrow-body-style': ['error', 'as-needed'],
        'no-var': 'error',
        'prefer-const': [
            'error',
            {
                destructuring: 'all'
            }
        ],
        // @typescript-eslint/eslint-plugin
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                args: 'none'
            }
        ],
        // eslint-plugin-header
        'header/header': [
            2,
            'block',
            [
                {
                    pattern: '[\n\r]+ \\* Copyright \\([cC]\\) \\d{4}(-\\d{4})? .*[\n\r]+',
                    template: `*******************************************************************************
 * Copyright (c) ${year} EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 *******************************************************************************`
                }
            ]
        ],
        // eslint-plugin-import
        'import/export': 'off', // we have multiple exports due to namespaces, enums and classes that share the same name
        'import/no-deprecated': 'error',
        // eslint-plugin-no-null
        'no-null/no-null': 'error',
        // chai friendly
        'no-unused-expressions': 'off',
        'chai-friendly/no-unused-expressions': 'error'
    }
};
