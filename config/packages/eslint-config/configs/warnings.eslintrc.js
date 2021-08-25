module.exports = {
    rules: {
        // https://eslint.org/docs/rules/
        "brace-style": ["warn", "1tbs"],
        "comma-dangle": "warn",
        indent: [
            "warn",
            4,
            {
                SwitchCase: 1,
            },
        ],
        "no-invalid-this": "warn",
        "no-new-wrappers": "warn",
        "no-return-await": "warn",
        "no-shadow": [
            "warn",
            {
                hoist: "all",
            },
        ],
        "no-trailing-spaces": "warn",
        "no-void": "warn",
        "prefer-const": [
            "warn",
            {
                destructuring: "all",
            },
        ],
        "prefer-object-spread": "warn",
        radix: "warn",
        "spaced-comment": [
            "warn",
            "always",
            {
                exceptions: ["*", "+", "-", "/", "!"],
            },
        ],
        "use-isnan": "warn",
        // @typescript-eslint/eslint-plugin
        "@typescript-eslint/explicit-function-return-type": [
            "warn",
            {
                allowExpressions: true,
            },
        ],
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/type-annotation-spacing": "warn",
    },
};
