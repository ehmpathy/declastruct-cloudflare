/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { refByUnique } from 'domain-objects';

import {
  DeclaredCloudflareDomainDnsRecord,
  DeclaredCloudflareDomainZone,
  getDeclastructCloudflareProvider,
} from '../../../../../dist/contract/sdks';

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
 * .why = defines desired state of resources for test verification
 *
 * .note
 *   - returns empty array when no test zone is configured
 *   - tests verify the declastruct workflow works even with empty resources
 *   - when CLOUDFLARE_TEST_ZONE_NAME is set, creates test DNS records
 */
export const getResources = async () => {
  // if no test zone configured, return empty to verify workflow only
  const testZoneName = process.env.CLOUDFLARE_TEST_ZONE_NAME;
  if (!testZoneName) return [];

  // declare the zone (must already exist in cloudflare)
  const zone = new DeclaredCloudflareDomainZone({
    name: testZoneName,
    type: 'full',
  });

  // declare a TXT record for acceptance test (safe, no impact on real services)
  const txtRecord = new DeclaredCloudflareDomainDnsRecord({
    zone: refByUnique(zone),
    name: `declastruct-acceptance-test.${testZoneName}`,
    type: 'TXT',
    content: `declastruct-test-${Date.now()}`,
    ttl: 1, // automatic TTL
    proxied: false, // TXT records cannot be proxied
  });

  return [zone, txtRecord];
};
