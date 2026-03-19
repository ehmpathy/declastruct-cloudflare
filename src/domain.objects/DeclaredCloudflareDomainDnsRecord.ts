import { DomainEntity, type RefByUnique } from 'domain-objects';

import { DeclaredCloudflareDomainDnsRecordSettings } from './DeclaredCloudflareDomainDnsRecordSettings';
import type { DeclaredCloudflareDomainDnsRecordType } from './DeclaredCloudflareDomainDnsRecordType';
import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

/**
 * .what = a cloudflare dns record
 * .why = enables declarative dns record management
 *
 * .identity
 *   - @primary = [id] — assigned by cloudflare on creation
 *   - @unique = [zone, name, type, content] — composite unique within zone
 *
 * .note
 *   - same name can have multiple records of different types
 *   - A/AAAA cannot coexist with CNAME on same name
 *   - zone is a Ref, enabling declaration before zone exists
 */
export interface DeclaredCloudflareDomainDnsRecord {
  /**
   * .what = the record id
   * .note = @metadata — assigned by cloudflare
   */
  id?: string;

  /**
   * .what = the parent zone reference
   * .note = @unique (part of composite key)
   * .why = enables declaring records for zones that don't exist yet
   */
  zone: RefByUnique<typeof DeclaredCloudflareDomainZone>;

  /**
   * .what = the dns record name
   * .note = @unique (part of composite key)
   * .example = 'api.example.com'
   */
  name: string;

  /**
   * .what = the record type
   * .note = @unique (part of composite key)
   */
  type: DeclaredCloudflareDomainDnsRecordType;

  /**
   * .what = the record content/value
   * .note = @unique (part of composite key) — enables multiple records with same (zone, name, type) for load distribution
   */
  content: string;

  /**
   * .what = time-to-live in seconds
   * .note = 1 = automatic, 60-86400 for manual (30+ for enterprise)
   */
  ttl: number;

  /**
   * .what = whether cloudflare proxies traffic
   */
  proxied?: boolean;

  /**
   * .what = optional comment/annotation
   */
  comment?: string;

  /**
   * .what = optional tags
   */
  tags?: string[];

  /**
   * .what = priority for MX records
   * .note = only applicable to MX type
   */
  priority?: number;

  /**
   * .what = record-specific settings
   */
  settings?: DeclaredCloudflareDomainDnsRecordSettings;

  /**
   * .what = when the record was created
   * .note = @readonly
   */
  createdOn?: string;

  /**
   * .what = when the record was last modified
   * .note = @readonly
   */
  modifiedOn?: string;

  /**
   * .what = whether the record can be proxied
   * .note = @readonly
   */
  proxiable?: boolean;
}

export class DeclaredCloudflareDomainDnsRecord
  extends DomainEntity<DeclaredCloudflareDomainDnsRecord>
  implements DeclaredCloudflareDomainDnsRecord
{
  public static primary = ['id'] as const;
  public static unique = ['zone', 'name', 'type', 'content'] as const;
  public static metadata = ['id'] as const;
  public static readonly = ['createdOn', 'modifiedOn', 'proxiable'] as const;
  public static nested = {
    zone: DeclaredCloudflareDomainZone,
    settings: DeclaredCloudflareDomainDnsRecordSettings,
  };
}
