module.exports = {
    rules: {
        // https://eslint.org/docs/rules/
        // Possible Errors
        "no-inner-declarations": "off",
        // Best Practices
        curly: "error",
        "eol-last": "error",
        eqeqeq: ["error", "smart"],
        "guard-for-in": "error",
        "no-caller": "error",
        "no-eval": "error",
        "no-redeclare": [
            "error",
            {
                builtinGlobals: false,
            },
        ],
        "no-restricted-imports": [
            "error",
            "..",
            "../index",
            "../..",
            "../../index",
        ],
        "no-sequences": "error",
        "no-throw-literal": "error",
        "no-unused-expressions": [
            "error",
            {
                allowShortCircuit: true,
                allowTernary: true,
            },
        ],
        // Variables
        "no-unused-vars": "off", // typescript-eslint rule activated instead
        "no-use-before-define": "off", // typescript-eslint rule activated instead
        // Stylistic Issues
        "max-len": [
            "error",
            {
                code: 180,
            },
        ],
        "no-multiple-empty-lines": [
            "error",
            {
                max: 1,
            },
        ],
        "no-underscore-dangle": "off",
        quotes: "off", // typescript-eslint rule activated instead
        "space-before-function-paren": [
            "error",
            {
                anonymous: "always",
                named: "never",
                asyncArrow: "always",
            },
        ],
        "one-var": ["error", "never"],
        // ECMAScript6
        "arrow-body-style": ["error", "as-needed"],
        "arrow-parens": ["error", "as-needed"],
        "no-var": "error",
        "prefer-const": [
            "error",
            {
                destructuring: "all",
            },
        ],
        // @typescript-eslint/eslint-plugin
        "@typescript-eslint/class-name-casing": "error",
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                args: "none",
            },
        ],
        "@typescript-eslint/quotes": [
            "error",
            "single",
            {
                avoidEscape: true,
            },
        ],
        "@typescript-eslint/semi": ["error", "always"],
        // eslint-plugin-header
        "header/header": [
            2,
            "block",
            [
                {
                    pattern:
                        "[\n\r]+ \\* Copyright \\([cC]\\) \\d{4}(-\\d{4})? .*[\n\r]+",
                    template: `*****3**************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
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
 *******************************************************************************`,
                },
            ],
        ],
        // eslint-plugin-import
        "import/export": "off", // we have multiple exports due to namespaces, enums and classes that share the same name
        "import/no-deprecated": "error",
        // eslint-plugin-no-null
        "no-null/no-null": "error",
    },
};
