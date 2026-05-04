import type { HasReadonly } from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainRuleRedirect,
  DeclaredCloudflareDomainRuleRedirect as DeclaredCloudflareDomainRuleRedirectInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';
import { expandZoneRef } from '@src/domain.operations/domainZone/expandZoneRef';

import {
  castAllIntoCloudflareRedirectRuleParams,
  castIntoCloudflareRedirectRuleParam,
} from './castIntoCloudflareRedirectRuleParam';
import { castAllIntoDeclaredCloudflareDomainRuleRedirects } from './castIntoDeclaredCloudflareDomainRuleRedirect';
import {
  findRuleBySlug,
  hasIdMismatch,
  hasRuleSpecDiff,
  replaceRuleBySlug,
} from './findRuleByKey';
import { getAllDomainRuleRedirects } from './getAllDomainRuleRedirects';

/**
 * .what = validates findsert can proceed when rule exists
 * .why = findsert fails if extant rule has different spec
 */
const assertFindsertCompatible = (input: {
  ruleDesired: DeclaredCloudflareDomainRuleRedirectInterface;
  ruleFound: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>;
}): void => {
  if (hasRuleSpecDiff({ desired: input.ruleDesired, found: input.ruleFound }))
    BadRequestError.throw(
      'cannot findsert rule; rule exists with different spec',
      {
        ruleDesired: input.ruleDesired,
        ruleFound: input.ruleFound,
      },
    );
};

/**
 * .what = builds the replacement rule for upsert
 * .why = merges desired spec with extant metadata
 */
const buildReplacementRule = (input: {
  ruleDesired: DeclaredCloudflareDomainRuleRedirectInterface;
  ruleFound: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>;
}): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect> => ({
  id: input.ruleFound.id,
  zone: input.ruleDesired.zone,
  slug: input.ruleDesired.slug,
  spec: input.ruleDesired.spec,
  modifiedOn: input.ruleFound.modifiedOn,
});

/**
 * .what = sets a redirect rule in cloudflare (findsert or upsert)
 * .why = enables declarative redirect rule management with idempotent operations
 *
 * .note
 *   - findsert: creates if not exists, returns extant if found
 *   - upsert: creates if not exists, updates if found
 *   - operates on entire ruleset (cloudflare requires PUT of full ruleset)
 */
export const setDomainRuleRedirect = async (
  input: PickOne<{
    findsert: DeclaredCloudflareDomainRuleRedirectInterface;
    upsert: DeclaredCloudflareDomainRuleRedirectInterface;
  }>,
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>> => {
  const { client } = context.cloudflare;

  // determine the rule to set
  const ruleDesired = input.findsert ?? input.upsert;
  if (!ruleDesired)
    throw new UnexpectedCodePathError('no rule in input', { input });

  // expand zone ref to get both id and name
  const zone = await expandZoneRef(ruleDesired.zone, context);

  // get all rules for this zone
  const rulesFound = await getAllDomainRuleRedirects(
    { zone: { name: zone.name } },
    context,
  );

  // find extant rule by slug (unique key within zone)
  const ruleFound = findRuleBySlug({
    rules: rulesFound,
    slug: ruleDesired.slug,
  });

  // sanity check: if rule exists and has different id than expected
  if (hasIdMismatch({ desired: ruleDesired, found: ruleFound }))
    throw new UnexpectedCodePathError(
      'rule found with different id than expected',
      { ruleFoundId: ruleFound?.id, ruleExpectedId: ruleDesired.id },
    );

  // findsert: validate compatibility, return extant
  if (ruleFound && input.findsert) {
    assertFindsertCompatible({ ruleDesired, ruleFound });
    return ruleFound;
  }

  // upsert: update extant rule
  if (ruleFound && input.upsert) {
    const ruleUpdated = buildReplacementRule({ ruleDesired, ruleFound });
    const rulesWithReplacement = replaceRuleBySlug({
      rules: rulesFound,
      slug: ruleDesired.slug,
      with: ruleUpdated,
    });
    const updatedRulesParams =
      castAllIntoCloudflareRedirectRuleParams(rulesWithReplacement);

    // update the entire ruleset
    const updatedRuleset = await client.rulesets.phases.update(
      'http_request_dynamic_redirect',
      { zone_id: zone.id, rules: updatedRulesParams },
    );

    // find and return the updated rule
    const updatedRulesTyped = castAllIntoDeclaredCloudflareDomainRuleRedirects(
      updatedRuleset,
      { name: zone.name },
    );
    const updatedRule = findRuleBySlug({
      rules: updatedRulesTyped,
      slug: ruleDesired.slug,
    });
    if (!updatedRule)
      throw new UnexpectedCodePathError('updated rule not found in response', {
        ruleDesired,
        updatedRuleset,
      });

    return updatedRule;
  }

  // create new rule: add to ruleset
  const newRuleParam = castIntoCloudflareRedirectRuleParam(ruleDesired);
  const allRulesParams = [
    ...castAllIntoCloudflareRedirectRuleParams(rulesFound),
    newRuleParam,
  ];

  // update the entire ruleset with the new rule
  const createdRuleset = await client.rulesets.phases.update(
    'http_request_dynamic_redirect',
    { zone_id: zone.id, rules: allRulesParams },
  );

  // find and return the created rule
  const createdRulesTyped = castAllIntoDeclaredCloudflareDomainRuleRedirects(
    createdRuleset,
    { name: zone.name },
  );
  const createdRule = findRuleBySlug({
    rules: createdRulesTyped,
    slug: ruleDesired.slug,
  });
  if (!createdRule)
    throw new UnexpectedCodePathError('created rule not found in response', {
      ruleDesired,
      createdRuleset,
    });

  return createdRule;
};
