/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
 ********************************************************************************/
const esbuild = require('esbuild');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log(`${watch ? '[watch]' : ''} build started`);
        });
        build.onEnd(result => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            let resultMessage = '';
            if (watch) {
                resultMessage += '\n';
            }
            resultMessage += ' build finished';
            if (result.errors.length !== 0) {
                resultMessage += `\n✘ ${result.errors.length} error(s)`;
            }
            if (result.warnings.length !== 0) {
                resultMessage += `\n⚠ ${result.warnings.length} warning(s)`;
            }
            console.log(resultMessage);
        });
    }
};

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/cli.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/cli.js',
        logLevel: 'silent',
        banner: {
            js: '#!/usr/bin/env node'
        },
        plugins: [
            /* add to the end of plugins array */
            esbuildProblemMatcherPlugin
        ]
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
        // Make the generated CLI file executable
        try {
            fs.chmodSync('dist/cli.js', 0o755);
        } catch (error) {
            console.warn('Warning: Could not set executable permissions on dist/cli.js:', error.message);
        }
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
