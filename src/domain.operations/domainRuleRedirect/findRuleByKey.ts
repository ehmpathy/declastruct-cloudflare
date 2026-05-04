import type { HasReadonly } from 'domain-objects';
import type { PickOne } from 'type-fns';

import type { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';

/**
 * .what = finds a redirect rule by primary (id) or unique (slug) key
 * .why = pure transformer for rule lookup logic
 */
export const findRuleByKey = (input: {
  rules: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[];
  by: PickOne<{
    primary: { id: string };
    unique: { slug: string };
  }>;
}): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect> | null => {
  if (input.by.primary) {
    return input.rules.find((r) => r.id === input.by.primary!.id) ?? null;
  }
  if (input.by.unique) {
    return input.rules.find((r) => r.slug === input.by.unique!.slug) ?? null;
  }
  return null;
};

/**
 * .what = finds a redirect rule by slug
 * .why = pure transformer for slug-based lookup
 */
export const findRuleBySlug = (input: {
  rules: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[];
  slug: string;
}): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect> | null => {
  return input.rules.find((r) => r.slug === input.slug) ?? null;
};

/**
 * .what = filters out a rule by id
 * .why = pure transformer for rule removal logic
 */
export const filterOutRuleById = (input: {
  rules: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[];
  id: string;
}): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[] => {
  return input.rules.filter((r) => r.id !== input.id);
};

/**
 * .what = replaces a rule by slug in the rules array
 * .why = pure transformer for rule replacement logic
 */
export const replaceRuleBySlug = (input: {
  rules: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[];
  slug: string;
  with: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>;
}): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[] => {
  return input.rules.map((r) => (r.slug === input.slug ? input.with : r));
};

/**
 * .what = checks if found item has different id than desired expects
 * .why = pure transformer to detect id mismatches in findsert/upsert operations
 */
export const hasIdMismatch = (input: {
  desired: { id?: string };
  found: { id: string } | null;
}): boolean => {
  if (!input.found) return false;
  if (!input.desired.id) return false;
  return input.found.id !== input.desired.id;
};

/**
 * .what = compares target URLs (string or expression object)
 * .why = URLs can be string literals or { expression: string } objects
 */
const hasTargetUrlDifference = (
  desired: string | { expression: string },
  found: string | { expression: string },
): boolean => {
  if (typeof desired === 'string' && typeof found === 'string') {
    return desired !== found;
  }
  if (typeof desired === 'object' && typeof found === 'object') {
    return desired.expression !== found.expression;
  }
  // type mismatch = diff
  return true;
};

/**
 * .what = checks if two rules have spec differences
 * .why = pure transformer for spec comparison logic
 */
export const hasRuleSpecDiff = (input: {
  desired: DeclaredCloudflareDomainRuleRedirect;
  found: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>;
}): boolean => {
  const hasExpressionDiff =
    input.desired.spec.expression !== input.found.spec.expression;
  const hasEnabledDiff =
    (input.desired.spec.enabled ?? true) !== (input.found.spec.enabled ?? true);
  const hasStatusCodeDiff =
    input.desired.spec.action.statusCode !== input.found.spec.action.statusCode;
  const hasTargetUrlDiff = hasTargetUrlDifference(
    input.desired.spec.action.target.url,
    input.found.spec.action.target.url,
  );
  const hasQueryStringDiff =
    input.desired.spec.action.target.queryString !==
    input.found.spec.action.target.queryString;

  return (
    hasExpressionDiff ||
    hasEnabledDiff ||
    hasStatusCodeDiff ||
    hasTargetUrlDiff ||
    hasQueryStringDiff
  );
};
