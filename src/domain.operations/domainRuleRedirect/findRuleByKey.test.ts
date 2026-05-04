import type { HasReadonly } from 'domain-objects';
import { given, then, when } from 'test-fns';

import { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';

import {
  filterOutRuleById,
  findRuleByKey,
  findRuleBySlug,
  hasRuleSpecDiff,
  replaceRuleBySlug,
} from './findRuleByKey';

/**
 * .what = unit tests for findRuleByKey transformers
 * .why = verify pure lookup, filter, replace, and diff logic
 */
describe('findRuleByKey', () => {
  // cast to HasReadonly since test data has all readonly fields populated
  type RuleWithReadonly = HasReadonly<
    typeof DeclaredCloudflareDomainRuleRedirect
  >;

  const ruleA = new DeclaredCloudflareDomainRuleRedirect({
    id: 'rule-id-a',
    slug: 'http-to-https',
    zone: { name: 'example.com' },
    spec: {
      expression: '(not ssl)',
      enabled: true,
      action: {
        statusCode: 301,
        target: {
          url: 'https://example.com',
          queryString: 'preserve',
        },
      },
    },
    modifiedOn: null,
  }) as RuleWithReadonly;

  const ruleB = new DeclaredCloudflareDomainRuleRedirect({
    id: 'rule-id-b',
    slug: 'root-to-www',
    zone: { name: 'example.com' },
    spec: {
      expression: '(http.host eq "example.com")',
      enabled: true,
      action: {
        statusCode: 301,
        target: {
          url: 'https://www.example.com',
          queryString: 'preserve',
        },
      },
    },
    modifiedOn: null,
  }) as RuleWithReadonly;

  const rules: RuleWithReadonly[] = [ruleA, ruleB];

  given('findRuleByKey', () => {
    when('search by primary key', () => {
      then('returns rule if id matches', () => {
        const result = findRuleByKey({
          rules,
          by: { primary: { id: 'rule-id-a' } },
        });
        expect(result).toEqual(ruleA);
      });

      then('returns null if id not found', () => {
        const result = findRuleByKey({
          rules,
          by: { primary: { id: 'nonexistent' } },
        });
        expect(result).toBeNull();
      });
    });

    when('search by unique key', () => {
      then('returns rule if slug matches', () => {
        const result = findRuleByKey({
          rules,
          by: { unique: { slug: 'root-to-www' } },
        });
        expect(result).toEqual(ruleB);
      });

      then('returns null if slug not found', () => {
        const result = findRuleByKey({
          rules,
          by: { unique: { slug: 'nonexistent' } },
        });
        expect(result).toBeNull();
      });
    });
  });

  given('findRuleBySlug', () => {
    when('slug exists', () => {
      then('returns the rule', () => {
        const result = findRuleBySlug({ rules, slug: 'http-to-https' });
        expect(result).toEqual(ruleA);
      });
    });

    when('slug does not exist', () => {
      then('returns null', () => {
        const result = findRuleBySlug({ rules, slug: 'nonexistent' });
        expect(result).toBeNull();
      });
    });
  });

  given('filterOutRuleById', () => {
    when('id exists in rules', () => {
      then('returns rules without that id', () => {
        const result = filterOutRuleById({ rules, id: 'rule-id-a' });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(ruleB);
      });
    });

    when('id does not exist', () => {
      then('returns all rules unchanged', () => {
        const result = filterOutRuleById({ rules, id: 'nonexistent' });
        expect(result).toHaveLength(2);
      });
    });
  });

  given('replaceRuleBySlug', () => {
    when('slug exists', () => {
      const updatedRule = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: { ...ruleA.spec, enabled: false },
      }) as RuleWithReadonly;

      then('replaces the rule at that slug', () => {
        const result = replaceRuleBySlug({
          rules,
          slug: 'http-to-https',
          with: updatedRule,
        });
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(updatedRule);
        expect(result[1]).toEqual(ruleB);
      });
    });

    when('slug does not exist', () => {
      then('returns rules unchanged', () => {
        const result = replaceRuleBySlug({
          rules,
          slug: 'nonexistent',
          with: ruleA,
        });
        expect(result).toEqual(rules);
      });
    });
  });

  given('hasRuleSpecDiff', () => {
    when('specs are identical', () => {
      then('returns false', () => {
        const result = hasRuleSpecDiff({
          desired: ruleA,
          found: ruleA,
        });
        expect(result).toBe(false);
      });
    });

    when('expression differs', () => {
      const desired = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: { ...ruleA.spec, expression: '(ssl)' },
      });

      then('returns true', () => {
        const result = hasRuleSpecDiff({ desired, found: ruleA });
        expect(result).toBe(true);
      });
    });

    when('enabled differs', () => {
      const desired = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: { ...ruleA.spec, enabled: false },
      });

      then('returns true', () => {
        const result = hasRuleSpecDiff({ desired, found: ruleA });
        expect(result).toBe(true);
      });
    });

    when('statusCode differs', () => {
      const desired = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: { ...ruleA.spec.action, statusCode: 302 },
        },
      });

      then('returns true', () => {
        const result = hasRuleSpecDiff({ desired, found: ruleA });
        expect(result).toBe(true);
      });
    });

    when('target url differs', () => {
      const desired = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: { ...ruleA.spec.action.target, url: 'https://other.com' },
          },
        },
      });

      then('returns true', () => {
        const result = hasRuleSpecDiff({ desired, found: ruleA });
        expect(result).toBe(true);
      });
    });

    when('target url uses expression and matches', () => {
      const ruleWithExpression = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: {
              ...ruleA.spec.action.target,
              url: {
                expression:
                  'concat("https://", http.host, http.request.uri.path)',
              },
            },
          },
        },
      }) as RuleWithReadonly;

      const desiredSame = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: {
              ...ruleA.spec.action.target,
              url: {
                expression:
                  'concat("https://", http.host, http.request.uri.path)',
              },
            },
          },
        },
      });

      then('returns false for identical expressions', () => {
        const result = hasRuleSpecDiff({
          desired: desiredSame,
          found: ruleWithExpression,
        });
        expect(result).toBe(false);
      });
    });

    when('target url uses expression and differs', () => {
      const ruleWithExpression = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: {
              ...ruleA.spec.action.target,
              url: {
                expression:
                  'concat("https://", http.host, http.request.uri.path)',
              },
            },
          },
        },
      }) as RuleWithReadonly;

      const desiredDifferent = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: {
              ...ruleA.spec.action.target,
              url: {
                expression:
                  'concat("https://www.", http.host, http.request.uri.path)',
              },
            },
          },
        },
      });

      then('returns true for different expressions', () => {
        const result = hasRuleSpecDiff({
          desired: desiredDifferent,
          found: ruleWithExpression,
        });
        expect(result).toBe(true);
      });
    });

    when('target url type mismatch (string vs expression)', () => {
      const desiredWithExpression = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: {
              ...ruleA.spec.action.target,
              url: { expression: 'concat("https://", http.host)' },
            },
          },
        },
      });

      then('returns true for type mismatch', () => {
        // ruleA has string url, desiredWithExpression has expression url
        const result = hasRuleSpecDiff({
          desired: desiredWithExpression,
          found: ruleA,
        });
        expect(result).toBe(true);
      });
    });

    when('queryString differs', () => {
      const desired = new DeclaredCloudflareDomainRuleRedirect({
        ...ruleA,
        spec: {
          ...ruleA.spec,
          action: {
            ...ruleA.spec.action,
            target: { ...ruleA.spec.action.target, queryString: 'ignore' },
          },
        },
      });

      then('returns true', () => {
        const result = hasRuleSpecDiff({ desired, found: ruleA });
        expect(result).toBe(true);
      });
    });
  });
});
