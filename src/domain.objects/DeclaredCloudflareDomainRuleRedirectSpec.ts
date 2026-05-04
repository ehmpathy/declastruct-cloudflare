import { DomainLiteral } from 'domain-objects';

/**
 * .what = redirect target URL specification
 * .why = encapsulates static or dynamic URL target
 */
export interface DeclaredCloudflareDomainRuleRedirectTargetUrl {
  /**
   * .what = cloudflare expression for dynamic URL
   * .example = 'concat("https://", http.host, http.request.uri.path)'
   */
  expression: string;
}

export class DeclaredCloudflareDomainRuleRedirectTargetUrl
  extends DomainLiteral<DeclaredCloudflareDomainRuleRedirectTargetUrl>
  implements DeclaredCloudflareDomainRuleRedirectTargetUrl {}

/**
 * .what = redirect target configuration
 * .why = specifies where to redirect and how to handle query strings
 */
export interface DeclaredCloudflareDomainRuleRedirectTarget {
  /**
   * .what = the target URL
   * .note = can be static string or dynamic expression object
   */
  url: string | DeclaredCloudflareDomainRuleRedirectTargetUrl;

  /**
   * .what = how to handle query strings
   */
  queryString: 'preserve' | 'ignore';
}

export class DeclaredCloudflareDomainRuleRedirectTarget
  extends DomainLiteral<DeclaredCloudflareDomainRuleRedirectTarget>
  implements DeclaredCloudflareDomainRuleRedirectTarget
{
  public static nested = {
    url: DeclaredCloudflareDomainRuleRedirectTargetUrl,
  };
}

/**
 * .what = redirect action configuration
 * .why = specifies the redirect behavior (status code and target)
 */
export interface DeclaredCloudflareDomainRuleRedirectAction {
  /**
   * .what = HTTP status code for the redirect
   */
  statusCode: 301 | 302 | 303 | 307 | 308;

  /**
   * .what = the redirect target
   */
  target: DeclaredCloudflareDomainRuleRedirectTarget;
}

export class DeclaredCloudflareDomainRuleRedirectAction
  extends DomainLiteral<DeclaredCloudflareDomainRuleRedirectAction>
  implements DeclaredCloudflareDomainRuleRedirectAction
{
  public static nested = {
    target: DeclaredCloudflareDomainRuleRedirectTarget,
  };
}

/**
 * .what = specification for a cloudflare redirect rule
 * .why = enables declarative redirect rule configuration
 *
 * .note
 *   - action.type='redirect' is injected by DAO, not in user spec
 *   - expression uses cloudflare ruleset language
 *   - use http.host for hostname match (cf.zone.name not available)
 */
export interface DeclaredCloudflareDomainRuleRedirectSpec {
  /**
   * .what = cloudflare expression that triggers the redirect
   * .example = '(http.request.uri.scheme eq "http")'
   */
  expression: string;

  /**
   * .what = whether the rule is enabled
   * .note = null means use cloudflare default (true)
   */
  enabled: boolean | null;

  /**
   * .what = the redirect action configuration
   */
  action: DeclaredCloudflareDomainRuleRedirectAction;
}

export class DeclaredCloudflareDomainRuleRedirectSpec
  extends DomainLiteral<DeclaredCloudflareDomainRuleRedirectSpec>
  implements DeclaredCloudflareDomainRuleRedirectSpec
{
  public static nested = {
    action: DeclaredCloudflareDomainRuleRedirectAction,
  };
}
