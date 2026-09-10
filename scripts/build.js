import { execSync } from 'child_process';
import * as esbuild from 'esbuild';

async function build() {
  console.log('[Build] 1. Building frontend distribution with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('[Build] 2. Bundling Vercel Serverless API entrypoint (api/index.js)...');
  await esbuild.build({
    entryPoints: ['server/apiRouter.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    outfile: 'api/index.js'
  });

  console.log('[Build] 3. Bundling Node.js production server (dist/server.cjs)...');
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs'
  });

  console.log('✅ [Build] All artifacts built successfully!');
}

build().catch((err) => {
  console.error('❌ [Build] Build failed:', err);
  process.exit(1);
});
