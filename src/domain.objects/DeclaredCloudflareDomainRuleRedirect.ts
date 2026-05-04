import { DomainEntity, type RefByUnique } from 'domain-objects';

import { DeclaredCloudflareDomainRuleRedirectSpec } from './DeclaredCloudflareDomainRuleRedirectSpec';
import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

/**
 * .what = a cloudflare redirect rule within a zone's ruleset
 * .why = declarative redirect rule management
 *
 * .identity
 *   - @primary = [id] — assigned by cloudflare on creation
 *   - @unique = [zone, slug] — slug is unique per zone
 *
 * .note
 *   - slug maps to description in cloudflare API
 *   - rules are managed via PUT of entire ruleset
 *   - zone is a Ref, for declaration before zone exists
 */
export interface DeclaredCloudflareDomainRuleRedirect {
  /**
   * .what = the rule id
   * .note = @metadata — assigned by cloudflare
   */
  id?: string;

  /**
   * .what = the parent zone reference
   * .note = @unique (part of composite key)
   * .why = allows rules to be declared for zones that don't exist yet
   */
  zone: RefByUnique<typeof DeclaredCloudflareDomainZone>;

  /**
   * .what = unique identifier for the rule within zone
   * .note = @unique (part of composite key)
   * .note = maps to description in cloudflare API
   * .example = 'http-to-https'
   */
  slug: string;

  /**
   * .what = the redirect rule specification
   */
  spec: DeclaredCloudflareDomainRuleRedirectSpec;

  /**
   * .what = when the rule was last modified
   * .note = @readonly — optional on input, required on read
   * .note = cloudflare only provides last_updated, not created_on for rules
   */
  modifiedOn?: string | null;
}

export class DeclaredCloudflareDomainRuleRedirect
  extends DomainEntity<DeclaredCloudflareDomainRuleRedirect>
  implements DeclaredCloudflareDomainRuleRedirect
{
  public static primary = ['id'] as const;
  public static unique = ['zone', 'slug'] as const;
  public static metadata = ['id'] as const;
  public static readonly = ['modifiedOn'] as const;
  public static nested = {
    zone: DeclaredCloudflareDomainZone,
    spec: DeclaredCloudflareDomainRuleRedirectSpec,
  };
}
