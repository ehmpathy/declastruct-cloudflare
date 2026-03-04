import Cloudflare from 'cloudflare';
import { BadRequestError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';

/**
 * .what = creates a sample cloudflare API context for integration testing
 * .why = provides consistent test context with real credentials from env
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - fails fast if credentials are missing
 */
export const getSampleCloudflareApiContext = (): ContextCloudflareApi &
  ContextLogTrail => {
  // fail-fast: require env vars
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken)
    BadRequestError.throw(
      'CLOUDFLARE_API_TOKEN env var required for integration tests',
    );
  if (!accountId)
    BadRequestError.throw(
      'CLOUDFLARE_ACCOUNT_ID env var required for integration tests',
    );

  // create the client
  const client = new Cloudflare({ apiToken });

  return {
    cloudflare: {
      client,
      accountId,
    },
    log: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  };
};
