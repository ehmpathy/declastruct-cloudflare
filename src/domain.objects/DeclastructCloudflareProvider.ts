import type { DeclastructDao, DeclastructProvider } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from './ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecord } from './DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainRegistration } from './DeclaredCloudflareDomainRegistration';
import type { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

/**
 * .what = the declastruct provider for cloudflare resources
 * .why = provides type safety and reusability for the cloudflare provider
 */
export type DeclastructCloudflareProvider = DeclastructProvider<
  {
    DeclaredCloudflareDomainZone: DeclastructDao<
      typeof DeclaredCloudflareDomainZone,
      ContextCloudflareApi & ContextLogTrail
    >;
    DeclaredCloudflareDomainDnsRecord: DeclastructDao<
      typeof DeclaredCloudflareDomainDnsRecord,
      ContextCloudflareApi & ContextLogTrail
    >;
    DeclaredCloudflareDomainRegistration: DeclastructDao<
      typeof DeclaredCloudflareDomainRegistration,
      ContextCloudflareApi & ContextLogTrail
    >;
  },
  ContextCloudflareApi & ContextLogTrail
>;
