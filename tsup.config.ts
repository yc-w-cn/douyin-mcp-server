import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,  // 禁用 minify 以避免函数名重命名问题
  target: 'node18',
  platform: 'node',
  banner: {
    js: '#!/usr/bin/env node'
  },
  outDir: 'dist',
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
    'axios'
  ]
})