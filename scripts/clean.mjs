import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = [
  'node_modules',
  'client/node_modules',
  'server/node_modules',
  'client/dist',
  'server/dist',
  'coverage',
];

for (const target of targets) {
  rmSync(resolve(target), { force: true, recursive: true });
}
