import { rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const DIST_DIRECTORY = resolve(process.cwd(), 'dist');
const PROTECTED_DIRECTORIES = [
  'processes',
  'metadata',
  'organisation',
  'architecture',
  'governance',
  'data',
  'model',
];

async function ensureDistExists() {
  try {
    const details = await stat(DIST_DIRECTORY);
    if (!details.isDirectory()) {
      throw new Error('dist exists but is not a directory.');
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error('dist does not exist. Run the Vite build before stripping repository data.');
    }
    throw error;
  }
}

async function main() {
  await ensureDistExists();

  for (const directory of PROTECTED_DIRECTORIES) {
    const target = resolve(DIST_DIRECTORY, directory);
    await rm(target, { recursive: true, force: true });
    console.log(`Removed protected repository data from dist/${directory}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
