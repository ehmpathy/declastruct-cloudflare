import { DomainLiteral } from 'domain-objects';

/**
 * .what = record-specific settings for dns records
 * .why = enables type-safe configuration of dns record behaviors
 */
export interface DeclaredCloudflareDomainDnsRecordSettings {
  /**
   * .what = only return ipv4 addresses for A records
   */
  ipv4Only?: boolean;

  /**
   * .what = only return ipv6 addresses for AAAA records
   */
  ipv6Only?: boolean;

  /**
   * .what = flatten cname at edge for external lookup
   */
  flattenCname?: boolean;
}

export class DeclaredCloudflareDomainDnsRecordSettings
  extends DomainLiteral<DeclaredCloudflareDomainDnsRecordSettings>
  implements DeclaredCloudflareDomainDnsRecordSettings {}
