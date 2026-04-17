/**
 * .what = supported dns record types for cloudflare
 * .why = enables type-safe record type specification
 */
export type DeclaredCloudflareDomainDnsRecordType =
  // standard
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'TXT'
  // advanced
  | 'CAA'
  | 'CERT'
  | 'DNSKEY'
  | 'DS'
  | 'HTTPS'
  | 'LOC'
  | 'NAPTR'
  | 'OPENPGPKEY'
  | 'SMIMEA'
  | 'SRV'
  | 'SSHFP'
  | 'SVCB'
  | 'TLSA'
  | 'URI';
