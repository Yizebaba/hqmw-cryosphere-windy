import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import rollupSvelte from 'rollup-plugin-svelte';
import rollupSwc from 'rollup-plugin-swc3';
import rollupCleanup from 'rollup-plugin-cleanup';
import { less } from 'svelte-preprocess-less';
import sveltePreprocess from 'svelte-preprocess';
import { transformCodeToESMPlugin, keyPEM, certificatePEM } from '@windycom/plugin-devtools';
import fs from 'node:fs';

const servePlugin = process.env.SERVE === 'true' ? serve({
    contentBase: 'dist',
    host: '0.0.0.0',
    port: 9999,
    headers: { 'Access-Control-Allow-Origin': '*' },
    https: { key: keyPEM, cert: certificatePEM },
}) : null;

export default {
    input: 'src/plugin.svelte',
    output: [
        { file: 'dist/plugin.js', format: 'module', sourcemap: true },
        {
            file: 'dist/plugin.min.js',
            format: 'module',
            plugins: [rollupCleanup({ comments: 'none', extensions: ['ts'] }), terser()],
        },
    ],
    external: id => id.startsWith('@windy/'),
    onwarn: () => {},
    plugins: [
        rollupSvelte({
            emitCss: false,
            preprocess: {
                style: less({ sourceMap: false, math: 'always' }),
                script: data => sveltePreprocess({ sourceMap: true }).script(data),
            },
        }),
        rollupSwc({ include: ['**/*.ts', '**/*.svelte'], sourceMaps: true }),
        resolve({ browser: true, mainFields: ['module', 'jsnext:main', 'main'], dedupe: ['svelte'] }),
        commonjs(),
        transformCodeToESMPlugin(),
        {
            writeBundle() {
                const source = 'static/project-artifacts';
                const destination = 'dist/project-artifacts';
                fs.rmSync(destination, { recursive: true, force: true });
                if (fs.existsSync(source)) {
                    fs.cpSync(source, destination, { recursive: true });
                }
            },
        },
        servePlugin,
    ].filter(Boolean),
};
