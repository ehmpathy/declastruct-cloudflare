import { DeclaredCloudflareDomainRuleRedirectSpec } from './DeclaredCloudflareDomainRuleRedirectSpec';

/**
 * .what = preset spec to redirect HTTP to HTTPS
 * .why = common redirect pattern for secure connections
 *
 * .note
 *   - expression matches non-SSL requests via `ssl` field
 *   - redirects to same URL with HTTPS scheme
 *   - preserves query string
 *   - uses 301 (permanent) for SEO signal transfer
 */
export const RULE_REDIRECT_SPEC_HTTP_TO_HTTPS =
  new DeclaredCloudflareDomainRuleRedirectSpec({
    expression: '(not ssl)',
    enabled: true,
    action: {
      statusCode: 301,
      target: {
        url: {
          expression: 'concat("https://", http.host, http.request.uri.path)',
        },
        queryString: 'preserve',
      },
    },
  });

/**
 * .what = preset spec to redirect root domain to www subdomain
 * .why = common redirect pattern for canonical www URLs
 *
 * .note
 *   - expression matches requests NOT to www.*
 *   - redirects to www.{host}
 *   - preserves query string
 *   - uses 301 (permanent) for SEO signal transfer
 *   - uses http.host, NOT cf.zone.name (not available in expressions)
 *
 * .edgecase = redirects ALL non-www hosts, subdomains included
 *   - api.example.com becomes www.api.example.com (likely undesired)
 *   - for zones with subdomains, create custom expression:
 *     '(http.host eq "example.com")' to match only root domain
 */
export const RULE_REDIRECT_SPEC_ROOT_TO_WWW =
  new DeclaredCloudflareDomainRuleRedirectSpec({
    expression: '(not starts_with(http.host, "www."))',
    enabled: true,
    action: {
      statusCode: 301,
      target: {
        url: {
          expression:
            'concat("https://www.", http.host, http.request.uri.path)',
        },
        queryString: 'preserve',
      },
    },
  });
