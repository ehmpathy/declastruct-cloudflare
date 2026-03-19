import { given, then, when } from 'test-fns';

import { getSampleCloudflareApiContext } from '@src/.test/getSampleCloudflareApiContext';

import { getOneDomainWhoisRecord } from './getOneDomainWhoisRecord';

/**
 * .what = integration tests for domain WHOIS record operations
 * .why = verifies WHOIS lookup works against real cloudflare API
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests are read-only (WHOIS is a lookup, not a mutation)
 */
describe('domainWhoisRecord', () => {
  // skip if credentials not configured
  const hasCredentials =
    process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID;
  const describeWithCredentials = hasCredentials ? describe : describe.skip;

  describeWithCredentials('with live cloudflare api', () => {
    const getContext = () => getSampleCloudflareApiContext();

    given('a well-known registered domain', () => {
      when('[t0] getOneDomainWhoisRecord is called for google.com', () => {
        then('it should return WHOIS data with found=true', async () => {
          const whois = await getOneDomainWhoisRecord(
            { domain: 'google.com' },
            getContext(),
          );

          expect(whois).not.toBeNull();
          expect(whois?.domain).toBe('google.com');
          expect(whois?.found).toBe(true);
          expect(whois?.registrar).toBeDefined();
          expect(Array.isArray(whois?.nameservers)).toBe(true);
        });
      });
    });

    given('a domain that likely does not exist', () => {
      when('[t0] getOneDomainWhoisRecord is called', () => {
        then('it should return WHOIS data with found=false', async () => {
          // use a very unlikely domain name
          const whois = await getOneDomainWhoisRecord(
            { domain: 'this-domain-definitely-does-not-exist-12345.xyz' },
            getContext(),
          );

          // may return null (unsupported TLD) or found=false
          if (whois) {
            expect(whois.found).toBe(false);
          }
        });
      });
    });
  });
});
