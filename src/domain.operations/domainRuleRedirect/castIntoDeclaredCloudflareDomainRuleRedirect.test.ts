import { given, then, when } from 'test-fns';

import { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';

import {
  castAllIntoDeclaredCloudflareDomainRuleRedirects,
  castIntoDeclaredCloudflareDomainRuleRedirect,
} from './castIntoDeclaredCloudflareDomainRuleRedirect';

describe('castIntoDeclaredCloudflareDomainRuleRedirect', () => {
  given('a valid cloudflare redirect rule response with static URL', () => {
    const mockRule = {
      id: 'rule-123',
      description: 'http-to-https',
      expression: '(http.request.uri.scheme eq "http")',
      enabled: true,
      action: 'redirect',
      action_parameters: {
        from_value: {
          status_code: 301,
          preserve_query_string: true,
          target_url: {
            value: 'https://example.com',
          },
        },
      },
      last_updated: '2026-01-01T00:00:00Z',
    };

    when('cast is called with zone ref by name', () => {
      then('it should return a DeclaredCloudflareDomainRuleRedirect', () => {
        const result = castIntoDeclaredCloudflareDomainRuleRedirect(mockRule, {
          name: 'example.com',
        });

        expect(result).toBeInstanceOf(DeclaredCloudflareDomainRuleRedirect);
        expect(result.id).toEqual('rule-123');
        expect(result.zone).toEqual({ name: 'example.com' });
        expect(result.slug).toEqual('http-to-https');
        expect(result.spec.expression).toEqual(
          '(http.request.uri.scheme eq "http")',
        );
        expect(result.spec.enabled).toEqual(true);
        expect(result.spec.action.statusCode).toEqual(301);
        expect(result.spec.action.target.url).toEqual('https://example.com');
        expect(result.spec.action.target.queryString).toEqual('preserve');
        expect(result.modifiedOn).toEqual('2026-01-01T00:00:00Z');
      });
    });
  });

  given('a redirect rule with dynamic expression URL', () => {
    const mockRule = {
      id: 'rule-456',
      description: 'dynamic-redirect',
      expression: '(http.request.uri.scheme eq "http")',
      enabled: true,
      action: 'redirect',
      action_parameters: {
        from_value: {
          status_code: 308,
          preserve_query_string: true,
          target_url: {
            expression: 'concat("https://", http.host, http.request.uri.path)',
          },
        },
      },
      last_updated: '2026-02-01T00:00:00Z',
    };

    when('cast is called', () => {
      then('it should capture expression in target URL', () => {
        const result = castIntoDeclaredCloudflareDomainRuleRedirect(mockRule, {
          name: 'example.com',
        });

        expect(result.spec.action.target.url).toEqual({
          expression: 'concat("https://", http.host, http.request.uri.path)',
        });
        expect(result.spec.action.statusCode).toEqual(308);
      });
    });
  });

  given('a redirect rule with preserve_query_string false', () => {
    const mockRule = {
      id: 'rule-789',
      description: 'no-query',
      expression: '(true)',
      enabled: true,
      action: 'redirect',
      action_parameters: {
        from_value: {
          status_code: 302,
          preserve_query_string: false,
          target_url: {
            value: 'https://example.com',
          },
        },
      },
      last_updated: '2026-03-01T00:00:00Z',
    };

    when('cast is called', () => {
      then('it should set queryString to ignore', () => {
        const result = castIntoDeclaredCloudflareDomainRuleRedirect(mockRule, {
          name: 'example.com',
        });

        expect(result.spec.action.target.queryString).toEqual('ignore');
      });
    });
  });

  given('a non-redirect rule', () => {
    const mockRule = {
      id: 'rule-non',
      description: 'not-a-redirect',
      expression: '(true)',
      action: 'skip', // not a redirect
    };

    when('cast is called', () => {
      then('it should throw UnexpectedCodePathError', () => {
        expect(() =>
          castIntoDeclaredCloudflareDomainRuleRedirect(mockRule, {
            name: 'example.com',
          }),
        ).toThrow('expected redirect rule');
      });
    });
  });
});

describe('castAllIntoDeclaredCloudflareDomainRuleRedirects', () => {
  given('a ruleset with mixed rule types', () => {
    const mockRuleset = {
      id: 'ruleset-123',
      name: 'default',
      phase: 'http_request_dynamic_redirect',
      rules: [
        {
          id: 'rule-1',
          description: 'redirect-rule',
          expression: '(true)',
          action: 'redirect',
          action_parameters: {
            from_value: {
              status_code: 301,
              preserve_query_string: true,
              target_url: { value: 'https://example.com' },
            },
          },
          last_updated: '2026-01-01T00:00:00Z',
        },
        {
          id: 'rule-2',
          description: 'skip-rule',
          expression: '(true)',
          action: 'skip',
        },
        {
          id: 'rule-3',
          description: 'another-redirect',
          expression: '(http.host eq "old.com")',
          action: 'redirect',
          action_parameters: {
            from_value: {
              status_code: 302,
              preserve_query_string: false,
              target_url: { value: 'https://new.com' },
            },
          },
          last_updated: '2026-01-02T00:00:00Z',
        },
      ],
    };

    when('castAll is called', () => {
      then('it should return only redirect rules', () => {
        const results = castAllIntoDeclaredCloudflareDomainRuleRedirects(
          mockRuleset as Parameters<
            typeof castAllIntoDeclaredCloudflareDomainRuleRedirects
          >[0],
          { name: 'example.com' },
        );

        expect(results).toHaveLength(2);
        expect(results[0]!.slug).toEqual('redirect-rule');
        expect(results[1]!.slug).toEqual('another-redirect');
      });
    });
  });

  given('a null ruleset', () => {
    when('castAll is called', () => {
      then('it should return empty array', () => {
        const results = castAllIntoDeclaredCloudflareDomainRuleRedirects(null, {
          name: 'example.com',
        });

        expect(results).toEqual([]);
      });
    });
  });

  given('a ruleset with empty rules', () => {
    const mockRuleset = {
      id: 'ruleset-empty',
      name: 'default',
      phase: 'http_request_dynamic_redirect',
      kind: 'zone' as const,
      last_updated: '2026-01-01T00:00:00Z',
      version: '1',
      rules: [],
    };

    when('castAll is called', () => {
      then('it should return empty array', () => {
        const results = castAllIntoDeclaredCloudflareDomainRuleRedirects(
          mockRuleset as Parameters<
            typeof castAllIntoDeclaredCloudflareDomainRuleRedirects
          >[0],
          { name: 'example.com' },
        );

        expect(results).toEqual([]);
      });
    });
  });
});
