import { DomainEntity, DomainLiteral } from 'domain-objects';

/**
 * .what = a cloudflare zone (domain container for dns management)
 * .why = enables declarative dns and registrar management
 *
 * .identity
 *   - @primary = [id] — assigned by cloudflare on creation
 *   - @unique = [name] — domain names are unique within an account
 */
export interface DeclaredCloudflareDomainZone {
  /**
   * .what = the cloudflare zone id
   * .note = @metadata — assigned by cloudflare on creation
   */
  id?: string;

  /**
   * .what = the domain name
   * .note = @unique — domain names are unique within an account
   * .example = 'example.com'
   */
  name: string;

  /**
   * .what = the zone type
   * .note = must be 'full' for registrar features
   */
  type: 'full' | 'partial' | 'secondary';

  /**
   * .what = whether the zone is paused
   */
  paused?: boolean;

  /**
   * .what = the zone status
   * .note = @readonly — managed by cloudflare
   */
  status?: 'initializing' | 'pending' | 'active' | 'moved';

  /**
   * .what = cloudflare-assigned nameservers
   * .note = @readonly — assigned by cloudflare
   */
  nameServers?: string[];

  /**
   * .what = original dns setup before cloudflare
   * .note = @readonly — captured on zone creation
   */
  original: {
    nameservers: string[] | null;
    registrar: string | null;
  } | null;

  /**
   * .what = when the zone was created
   * .note = @readonly
   */
  createdOn?: string;

  /**
   * .what = when the zone was activated
   * .note = @readonly — null until zone is activated
   */
  activatedOn: string | null;
}

export class DeclaredCloudflareDomainZone
  extends DomainEntity<DeclaredCloudflareDomainZone>
  implements DeclaredCloudflareDomainZone
{
  public static primary = ['id'] as const;
  public static unique = ['name'] as const;
  public static metadata = ['id'] as const;
  public static readonly = [
    'status',
    'nameServers',
    'original',
    'createdOn',
    'activatedOn',
  ] as const;
  public static nested = { original: DomainLiteral };
}
