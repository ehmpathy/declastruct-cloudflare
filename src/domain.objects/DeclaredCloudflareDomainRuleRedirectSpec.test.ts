import { DeclaredCloudflareDomainRuleRedirectSpec } from './DeclaredCloudflareDomainRuleRedirectSpec';

describe('DeclaredCloudflareDomainRuleRedirectSpec', () => {
  it('should be instantiable with static URL target', () => {
    const spec = new DeclaredCloudflareDomainRuleRedirectSpec({
      expression: '(http.host eq "old.example.com")',
      enabled: null,
      action: {
        statusCode: 301,
        target: {
          url: 'https://new.example.com',
          queryString: 'preserve',
        },
      },
    });
    expect(spec.expression).toEqual('(http.host eq "old.example.com")');
    expect(spec.action.statusCode).toEqual(301);
    expect(spec.action.target.url).toEqual('https://new.example.com');
    expect(spec.action.target.queryString).toEqual('preserve');
  });

  it('should be instantiable with dynamic expression URL target', () => {
    const spec = new DeclaredCloudflareDomainRuleRedirectSpec({
      expression: '(http.request.uri.scheme eq "http")',
      enabled: true,
      action: {
        statusCode: 308,
        target: {
          url: {
            expression: 'concat("https://", http.host, http.request.uri.path)',
          },
          queryString: 'preserve',
        },
      },
    });
    expect(spec.action.target.url).toEqual({
      expression: 'concat("https://", http.host, http.request.uri.path)',
    });
    expect(spec.enabled).toEqual(true);
  });

  it('should support all valid status codes', () => {
    const statusCodes = [301, 302, 303, 307, 308] as const;
    for (const statusCode of statusCodes) {
      const spec = new DeclaredCloudflareDomainRuleRedirectSpec({
        expression: '(true)',
        enabled: null,
        action: {
          statusCode,
          target: {
            url: 'https://example.com',
            queryString: 'ignore',
          },
        },
      });
      expect(spec.action.statusCode).toEqual(statusCode);
    }
  });

  it('should support ignore query string option', () => {
    const spec = new DeclaredCloudflareDomainRuleRedirectSpec({
      expression: '(true)',
      enabled: null,
      action: {
        statusCode: 301,
        target: {
          url: 'https://example.com',
          queryString: 'ignore',
        },
      },
    });
    expect(spec.action.target.queryString).toEqual('ignore');
  });

  it('should accept null for enabled to indicate cloudflare default', () => {
    const spec = new DeclaredCloudflareDomainRuleRedirectSpec({
      expression: '(true)',
      enabled: null,
      action: {
        statusCode: 301,
        target: {
          url: 'https://example.com',
          queryString: 'preserve',
        },
      },
    });
    expect(spec.enabled).toBeNull();
  });
});
