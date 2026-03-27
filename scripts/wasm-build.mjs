/**
 * Runs wasm-pack with ~/.cargo/bin on PATH so it works regardless of whether
 * the user has added Cargo's bin directory to their system PATH.
 */
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const cargoBin = join(homedir(), '.cargo', 'bin');

const env = {
  ...process.env,
  PATH: `${cargoBin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH ?? ''}`,
};

const result = spawnSync(
  'wasm-pack',
  ['build', 'wasm-processor', '--target', 'web', '--out-dir', 'pkg'],
  { stdio: 'inherit', env, shell: true },
);

process.exit(result.status ?? 1);
