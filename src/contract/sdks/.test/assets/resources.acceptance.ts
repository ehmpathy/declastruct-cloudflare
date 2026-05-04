/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { refByUnique } from 'domain-objects';

import {
  DeclaredCloudflareDomainDnsRecord,
  DeclaredCloudflareDomainRuleRedirect,
  DeclaredCloudflareDomainZone,
  getDeclastructCloudflareProvider,
  RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
  RULE_REDIRECT_SPEC_ROOT_TO_WWW,
} from '../../../../../dist/contract/sdks';

/**
 * .what = test zone name for acceptance tests
 * .why = demo account has this zone configured (active)
 */
const TEST_ZONE_NAME = 'sunshineoceansurferturtles.org';

/**
 * .what = unique slug for acceptance test run
 * .why = enables CREATE action test (new resource each run)
 * .note
 *   - uses env var if set (for stable CLI invocations)
 *   - falls back to Date.now() (first invocation sets it)
 */
export const ACCEPTANCE_TEST_SLUG =
  process.env.ACCEPTANCE_TEST_SLUG ?? `acceptance-test-${Date.now()}`;

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
 *   - uses sunshineoceansurferturtles.com (demo account zone)
 *   - declares zone + dns record + redirect rules
 */
export const getResources = async () => {
  // declare the zone (must already exist in cloudflare)
  const zone = new DeclaredCloudflareDomainZone({
    name: TEST_ZONE_NAME,
    type: 'full',
  });

  // declare a TXT record for acceptance test (safe, no impact on real services)
  // .note = content must be stable across plan/apply to avoid "plan is stale" errors
  const txtRecord = new DeclaredCloudflareDomainDnsRecord({
    zone: refByUnique(zone),
    name: `declastruct-acceptance-test.${TEST_ZONE_NAME}`,
    type: 'TXT',
    content: 'declastruct-acceptance-test-v1',
    ttl: 1, // automatic TTL
    proxied: false, // TXT records cannot be proxied
  });

  // declare redirect rules with presets
  const redirectHttpToHttps = new DeclaredCloudflareDomainRuleRedirect({
    zone: refByUnique(zone),
    slug: 'redirect-http-to-https',
    spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
    modifiedOn: null,
  });

  const redirectRootToWww = new DeclaredCloudflareDomainRuleRedirect({
    zone: refByUnique(zone),
    slug: 'redirect-root-to-www',
    spec: RULE_REDIRECT_SPEC_ROOT_TO_WWW,
    modifiedOn: null,
  });

  // unique redirect rule per test run (tests CREATE action)
  const redirectTestCreate = new DeclaredCloudflareDomainRuleRedirect({
    zone: refByUnique(zone),
    slug: ACCEPTANCE_TEST_SLUG,
    spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
    modifiedOn: null,
  });

  return [zone, txtRecord, redirectHttpToHttps, redirectRootToWww, redirectTestCreate];
};
