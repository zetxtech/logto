import { defineConfig, type Options } from 'tsup';

import { defaultConfig } from '../../tsup.shared.config.js';

export const config = Object.freeze({
  ...defaultConfig,
  entry: ['src/index.ts', 'src/workers/tasks/**/*.ts'],
  outDir: 'build',
  onSuccess: 'pnpm run copy:apidocs',
  // Mark adm-zip as external to avoid "Dynamic require of fs is not supported" error
  // adm-zip is a CommonJS module that uses require() internally
  noExternal: [],
  external: ['adm-zip'],
} satisfies Options);

export default defineConfig(config);
