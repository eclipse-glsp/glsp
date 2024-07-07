const esbuild = require('esbuild');

/** @param {import('esbuild').BuildOptions} context. */
async function doWatch(options) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching for changes...');
}

/** @type {import('esbuild').BuildOptions} */
const opts = {
    entryPoints: ['src/cli.ts'],
    bundle: true,
    outfile: 'dist/cli.js',
    platform: 'node',
    sourcemap: true,
    packages: 'external'
};

const production = process.argv.includes('-p') || process.argv.includes('--production');
if (production) {
    opts.minify = true;
    opts.sourcemap = false;
}
const watch = process.argv.includes('-w') || process.argv.includes('--watch');
if (!watch) {
    esbuild.build(opts).catch(() => process.exit(1));
} else {
    doWatch(opts);
}
