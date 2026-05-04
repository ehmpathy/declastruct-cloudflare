import { DeclaredCloudflareDomainRuleRedirect } from './DeclaredCloudflareDomainRuleRedirect';
import {
  RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
  RULE_REDIRECT_SPEC_ROOT_TO_WWW,
} from './DeclaredCloudflareDomainRuleRedirectPresets';
import { DeclaredCloudflareDomainRuleRedirectSpec } from './DeclaredCloudflareDomainRuleRedirectSpec';
import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

describe('DeclaredCloudflareDomainRuleRedirect', () => {
  it('should be instantiable with zone ref by name (unique) and preset spec', () => {
    const rule = new DeclaredCloudflareDomainRuleRedirect({
      zone: { name: 'example.com' },
      slug: 'http-to-https',
      spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
      modifiedOn: null,
    });
    expect(rule.zone).toEqual({ name: 'example.com' });
    expect(rule.slug).toEqual('http-to-https');
    expect(rule.spec.expression).toEqual('(not ssl)');
  });

  it('should be instantiable with root-to-www preset', () => {
    const rule = new DeclaredCloudflareDomainRuleRedirect({
      zone: { name: 'example.com' },
      slug: 'root-to-www',
      spec: RULE_REDIRECT_SPEC_ROOT_TO_WWW,
      modifiedOn: null,
    });
    expect(rule.spec.expression).toEqual(
      '(not starts_with(http.host, "www."))',
    );
    expect(rule.spec.action.statusCode).toEqual(301);
  });

  it('should be instantiable with all properties and readonly fields', () => {
    const rule = new DeclaredCloudflareDomainRuleRedirect({
      id: 'rule-123',
      zone: { name: 'example.com' },
      slug: 'custom-redirect',
      spec: new DeclaredCloudflareDomainRuleRedirectSpec({
        expression: '(http.host eq "old.example.com")',
        enabled: true,
        action: {
          statusCode: 302,
          target: {
            url: 'https://new.example.com',
            queryString: 'ignore',
          },
        },
      }),
      modifiedOn: '2026-01-02T00:00:00Z',
    });
    expect(rule.id).toEqual('rule-123');
    expect(rule.spec.action.statusCode).toEqual(302);
    expect(rule.spec.action.target.url).toEqual('https://new.example.com');
    expect(rule.spec.action.target.queryString).toEqual('ignore');
    expect(rule.modifiedOn).toEqual('2026-01-02T00:00:00Z');
  });

  it('should have correct static properties', () => {
    expect(DeclaredCloudflareDomainRuleRedirect.primary).toEqual(['id']);
    expect(DeclaredCloudflareDomainRuleRedirect.unique).toEqual([
      'zone',
      'slug',
    ]);
    expect(DeclaredCloudflareDomainRuleRedirect.metadata).toEqual(['id']);
    expect(DeclaredCloudflareDomainRuleRedirect.readonly).toContain(
      'modifiedOn',
    );
  });

  it('should have nested definitions', () => {
    expect(DeclaredCloudflareDomainRuleRedirect.nested.zone).toEqual(
      DeclaredCloudflareDomainZone,
    );
    expect(DeclaredCloudflareDomainRuleRedirect.nested.spec).toEqual(
      DeclaredCloudflareDomainRuleRedirectSpec,
    );
  });

  it('should support expression with dynamic target URL', () => {
    const rule = new DeclaredCloudflareDomainRuleRedirect({
      zone: { name: 'example.com' },
      slug: 'dynamic-redirect',
      spec: new DeclaredCloudflareDomainRuleRedirectSpec({
        expression: '(http.request.uri.scheme eq "http")',
        enabled: null,
        action: {
          statusCode: 308,
          target: {
            url: {
              expression:
                'concat("https://", http.host, http.request.uri.path)',
            },
            queryString: 'preserve',
          },
        },
      }),
      modifiedOn: null,
    });
    expect(rule.spec.action.target.url).toEqual({
      expression: 'concat("https://", http.host, http.request.uri.path)',
    });
    expect(rule.spec.action.statusCode).toEqual(308);
  });
});
