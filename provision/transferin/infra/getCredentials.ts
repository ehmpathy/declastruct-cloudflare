import { keyrack } from 'rhachet/keyrack';

/**
 * .what = gets cloudflare credentials from keyrack
 * .why = reusable across transfer-in steps
 *
 * .note = env=test uses ehmpath owner, otherwise uses default (user's keyrack)
 */
export const getCredentials = (input: {
  env: string;
}): { apiToken: string; accountId: string } => {
  const owner = input.env === 'test' ? 'ehmpath' : undefined;

  // source credentials into process.env
  keyrack.source({ env: input.env, owner, mode: 'strict' });

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    const ownerHint = input.env === 'test' ? '--owner ehmpath ' : '';
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
