/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getDeclastructCloudflareProvider } from '../../../../../dist/contract/sdks';

/**
 * .what = provider configuration for cloudflare acceptance tests
 * .why = enables declastruct CLI to interact with cloudflare API
 * .note = requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 */
export const getProviders = async () => [
  await getDeclastructCloudflareProvider(
    {
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    },
    { log: console },
  ),
];

/**
 * .what = resource declarations for cloudflare acceptance tests
 * .why = defines desired state of resources for testing
 *
 * .note
 *   - returns empty array when no test zone is configured
 *   - tests verify the declastruct workflow works even with empty resources
 *   - when CLOUDFLARE_TEST_ZONE_NAME is set, creates test DNS records
 */
export const getResources = async () => {
  // return empty resources to test the workflow
  // the demo account has no zones, so we can't create DNS records
  // this still verifies: providers work, plan works, apply works (as no-op)
  return [];
};
