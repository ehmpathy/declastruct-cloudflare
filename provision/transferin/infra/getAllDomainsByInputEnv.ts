import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * .what = loads domains from input file based on env
 * .why = reusable across transfer-in steps
 *
 * @param env - environment name (test, prod)
 * @param inputsDir - path to inputs directory (default: provision/transferin/inputs)
 */
export const getAllDomainsByInputEnv = (
  input: { env: string },
  options?: { inputsDir?: string },
): string[] => {
  const inputsDir =
    options?.inputsDir ??
    join(process.cwd(), 'provision', 'transferin', 'inputs');
  const inputPath = join(inputsDir, `env=${input.env}.json`);
  try {
    const fileContent = JSON.parse(readFileSync(inputPath, 'utf-8')) as {
      domains: string[];
    };
    return fileContent.domains;
  } catch {
    console.error(`
🐢 bummer dude...

input file not found: ${inputPath}

create it with:
  {"domains": ["example.com"]}
`);
    process.exit(2);
  }
};
