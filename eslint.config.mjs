import glspConfig from '@eclipse-glsp/eslint-config';

export default [
    ...glspConfig,
    // Ignore JS config/build files that are not part of the TS project
    {
        ignores: ['**/*.js', '**/*.mjs', '**/*.cjs', '.worktrees/**']
    },
    // Apply parserOptions.project only to TypeScript files
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    // CLI-specific overrides (import resolution doesn't fully work for the bundled CLI)
    {
        files: ['dev-packages/cli/**/*.ts'],
        rules: {
            'import-x/no-unresolved': 'off'
        }
    },
    // Disable @typescript-eslint/no-unused-expressions for test files (chai-friendly rule handles this)
    {
        files: ['**/*.spec.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            'import-x/namespace': 'off'
        }
    }
];
