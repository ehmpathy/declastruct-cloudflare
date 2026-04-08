/**
 * .what = extracts env from cli args
 * .why = reusable across transfer-in steps
 */
export const getEnvFromInput = (): string | null => {
  const args = process.argv.slice(2);
  const envIndex = args.indexOf('--env');
  if (envIndex !== -1 && args[envIndex + 1]) {
    return args[envIndex + 1]!;
  }
  return null;
};
