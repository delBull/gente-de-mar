import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist',
  format: 'esm',
  external: [
    'express',
    'pg',
    '@neondatabase/serverless',
    'drizzle-orm',
    // Add other external dependencies as needed
  ]
})