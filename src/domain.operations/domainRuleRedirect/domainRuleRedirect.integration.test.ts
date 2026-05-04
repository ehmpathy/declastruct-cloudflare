import { BadRequestError, ConstraintError } from 'helpful-errors';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { getSampleCloudflareApiContext } from '@src/.test/getSampleCloudflareApiContext';
import {
  RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
  RULE_REDIRECT_SPEC_ROOT_TO_WWW,
} from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirectPresets';
import { getOneDomainZone } from '@src/domain.operations/domainZone/getOneDomainZone';

import { delDomainRuleRedirect } from './delDomainRuleRedirect';
import { getAllDomainRuleRedirects } from './getAllDomainRuleRedirects';
import { getOneDomainRuleRedirect } from './getOneDomainRuleRedirect';
import { setDomainRuleRedirect } from './setDomainRuleRedirect';

/**
 * .what = test zone name for integration tests
 * .why = demo account has this zone configured (active)
 */
const TEST_ZONE_NAME = 'sunshineoceansurferturtles.org';

/**
 * .what = integration tests for domain redirect rule operations
 * .why = verifies redirect rule operations work against real cloudflare API
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests create/update/delete rules to verify full lifecycle
 */
describe('domainRuleRedirect', () => {
  // failfast if credentials not configured
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new ConstraintError(
      'cloudflare credentials required for integration tests',
      {
        hint: 'run: rhx keyrack unlock --owner ehmpath --env test',
      },
    );
  }

  describe('with live cloudflare api', () => {
    const getContext = () => getSampleCloudflareApiContext();

    // get the test zone — fail fast if not found
    const zoneData = useBeforeAll(async () => {
      const zone = await getOneDomainZone(
        { by: { unique: { name: TEST_ZONE_NAME } } },
        getContext(),
      );
      if (!zone)
        throw new ConstraintError(
          `test zone "${TEST_ZONE_NAME}" not found in cloudflare account`,
          {
            hint: 'ensure the test zone exists and is active in the demo account',
          },
        );
      return { zone };
    });

    given('a zone', () => {
      when('[t0] getAllDomainRuleRedirects is called by zone id', () => {
        then('it should return an array of redirect rules', async () => {
          const rules = await getAllDomainRuleRedirects(
            { zone: { id: zoneData.zone.id } },
            getContext(),
          );

          expect(Array.isArray(rules)).toBe(true);
          // verify each rule has expected shape (may be empty array)
          rules.forEach((rule) => {
            expect(rule.id).toBeDefined();
            expect(rule.slug).toBeDefined();
            expect(rule.spec).toBeDefined();
            expect(rule.spec.expression).toBeDefined();
            expect(rule.zone).toBeDefined();
          });
        });
      });

      when('[t1] getAllDomainRuleRedirects is called by zone name', () => {
        then('it should expand zone and return rules', async () => {
          const rules = await getAllDomainRuleRedirects(
            { zone: { name: zoneData.zone.name } },
            getContext(),
          );

          expect(Array.isArray(rules)).toBe(true);
        });
      });

      when(
        '[t2] getOneDomainRuleRedirect is called with non-existent slug',
        () => {
          then('it should return null', async () => {
            const rule = await getOneDomainRuleRedirect(
              {
                by: {
                  unique: {
                    zone: { id: zoneData.zone.id },
                    slug: `nonexistent-test-slug-${Date.now()}`,
                  },
                },
              },
              getContext(),
            );

            expect(rule).toBeNull();
          });
        },
      );
    });

    given('a zone with at least one redirect rule', () => {
      const rulesAndZone = useBeforeAll(async () => {
        const rules = await getAllDomainRuleRedirects(
          { zone: { id: zoneData.zone.id } },
          getContext(),
        );
        if (rules.length === 0)
          throw new ConstraintError(
            `test zone "${TEST_ZONE_NAME}" has no redirect rules`,
            {
              hint: 'ensure at least one redirect rule exists in the test zone',
            },
          );
        return { rules, zone: zoneData.zone };
      });

      when('[t0] getOneDomainRuleRedirect is called by primary key', () => {
        then('it should return the rule', async () => {
          const { rules, zone } = rulesAndZone;

          const rule = await getOneDomainRuleRedirect(
            {
              by: {
                primary: {
                  id: rules[0]!.id,
                  zone: { id: zone.id },
                },
              },
            },
            getContext(),
          );

          expect(rule).not.toBeNull();
          expect(rule?.id).toEqual(rules[0]!.id);
          expect(rule?.slug).toEqual(rules[0]!.slug);
          expect(rule?.spec).toBeDefined();
        });
      });

      when('[t1] getOneDomainRuleRedirect is called by unique key', () => {
        then('it should return the rule', async () => {
          const { rules, zone } = rulesAndZone;

          const rule = await getOneDomainRuleRedirect(
            {
              by: {
                unique: {
                  zone: { id: zone.id },
                  slug: rules[0]!.slug,
                },
              },
            },
            getContext(),
          );

          expect(rule).not.toBeNull();
          expect(rule?.id).toEqual(rules[0]!.id);
        });
      });

      when('[t2] getOneDomainRuleRedirect is called with zone name ref', () => {
        then('it should expand zone and return the rule', async () => {
          const { rules, zone } = rulesAndZone;

          const rule = await getOneDomainRuleRedirect(
            {
              by: {
                unique: {
                  zone: { name: zone.name },
                  slug: rules[0]!.slug,
                },
              },
            },
            getContext(),
          );

          expect(rule).not.toBeNull();
          expect(rule?.id).toEqual(rules[0]!.id);
        });
      });
    });

    given('setDomainRuleRedirect and delDomainRuleRedirect lifecycle', () => {
      // unique slug per test run to avoid collisions
      const testSlug = `integration-test-${Date.now()}`;

      // create the rule for lifecycle tests
      const ruleData = useBeforeAll(async () => {
        const created = await setDomainRuleRedirect(
          {
            findsert: {
              zone: { name: zoneData.zone.name },
              slug: testSlug,
              spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
            },
          },
          getContext(),
        );
        return { created };
      });

      // cleanup after all tests in this block
      afterAll(async () => {
        await delDomainRuleRedirect(
          {
            zone: { name: zoneData.zone.name },
            by: { unique: { slug: testSlug } },
          },
          getContext(),
        );
      });

      when('[t0] findsert creates a new rule', () => {
        then('rule has expected properties', () => {
          expect(ruleData.created.id).toBeDefined();
          expect(ruleData.created.slug).toEqual(testSlug);
          expect(ruleData.created.spec.expression).toEqual(
            RULE_REDIRECT_SPEC_HTTP_TO_HTTPS.expression,
          );
        });

        then('rule can be retrieved by slug', async () => {
          const found = await getOneDomainRuleRedirect(
            {
              by: {
                unique: {
                  zone: { name: zoneData.zone.name },
                  slug: testSlug,
                },
              },
            },
            getContext(),
          );
          expect(found).not.toBeNull();
          expect(found?.id).toEqual(ruleData.created.id);
        });
      });

      when('[t1] findsert with same spec is idempotent', () => {
        then('returns extant rule without modification', async () => {
          const ruleSecond = await setDomainRuleRedirect(
            {
              findsert: {
                zone: { name: zoneData.zone.name },
                slug: testSlug,
                spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS, // same spec
              },
            },
            getContext(),
          );

          // findsert should return extant without modification
          expect(ruleSecond.id).toEqual(ruleData.created.id);
          expect(ruleSecond.slug).toEqual(testSlug);
          expect(ruleSecond.spec.expression).toEqual(
            RULE_REDIRECT_SPEC_HTTP_TO_HTTPS.expression,
          );
        });
      });

      when('[t2] findsert with different spec throws', () => {
        then('throws BadRequestError for spec mismatch', async () => {
          const error = await getError(
            setDomainRuleRedirect(
              {
                findsert: {
                  zone: { name: zoneData.zone.name },
                  slug: testSlug,
                  spec: RULE_REDIRECT_SPEC_ROOT_TO_WWW, // different spec
                },
              },
              getContext(),
            ),
          );

          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('rule exists with different spec');
        });
      });

      when('[t3] upsert updates the rule spec', () => {
        then('rule spec is updated', async () => {
          const ruleUpdated = await setDomainRuleRedirect(
            {
              upsert: {
                zone: { name: zoneData.zone.name },
                slug: testSlug,
                spec: RULE_REDIRECT_SPEC_ROOT_TO_WWW,
              },
            },
            getContext(),
          );

          expect(ruleUpdated.slug).toEqual(testSlug);
          expect(ruleUpdated.spec.expression).toEqual(
            RULE_REDIRECT_SPEC_ROOT_TO_WWW.expression,
          );
        });
      });
    });

    given('delDomainRuleRedirect', () => {
      when('[t0] delete removes the rule', () => {
        then('rule is deleted and no longer exists', async () => {
          // create a rule to delete
          const slug = `del-test-${Date.now()}`;
          await setDomainRuleRedirect(
            {
              findsert: {
                zone: { name: zoneData.zone.name },
                slug,
                spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
              },
            },
            getContext(),
          );

          // delete it
          const result = await delDomainRuleRedirect(
            {
              zone: { name: zoneData.zone.name },
              by: { unique: { slug } },
            },
            getContext(),
          );
          expect(result.deleted).toBe(true);

          // verify it's gone
          const found = await getOneDomainRuleRedirect(
            {
              by: {
                unique: {
                  zone: { name: zoneData.zone.name },
                  slug,
                },
              },
            },
            getContext(),
          );
          expect(found).toBeNull();
        });
      });

      when('[t1] delete on non-existent is idempotent', () => {
        then('delete returns deleted=false for absent rule', async () => {
          const result = await delDomainRuleRedirect(
            {
              zone: { name: zoneData.zone.name },
              by: { unique: { slug: `nonexistent-${Date.now()}` } },
            },
            getContext(),
          );
          // rule not found, so deleted=false (idempotent)
          expect(result.deleted).toBe(false);
        });
      });
    });
  });
});
