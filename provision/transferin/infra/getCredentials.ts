import { keyrack } from 'rhachet/keyrack';
import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = gets cloudflare credentials from keyrack
 * .why = reusable across transfer-in steps
 *
 * .note = env=test uses ehmpath owner, prod requires OWNER env var
 */
export const getCredentials = (input: {
  env: string;
}): { apiToken: string; accountId: string } => {
  const owner =
    process.env.OWNER ??
    (input.env === 'test'
      ? 'ehmpath'
      : UnexpectedCodePathError.throw('OWNER env var required for prod'));

  // source credentials into process.env (outputs keyrack status to stdout)
  keyrack.source({ env: input.env, owner });

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    const ownerHint = `--owner ${owner} `;
    console.error(`
🐢 bummer dude...

credentials not found in keyrack.

run this first:
  rhx keyrack fill ${ownerHint}--env ${input.env}
  rhx keyrack unlock ${ownerHint}--env ${input.env}
`);
    process.exit(2);
  }

  return { apiToken, accountId };
};
