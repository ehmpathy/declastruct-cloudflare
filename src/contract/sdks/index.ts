/**
 * .what = public SDK exports for declastruct-cloudflare package
 * .why = enables consumers to use the declastruct provider interface and domain objects
 */

// cloudflare daos
export { DeclaredCloudflareDomainDnsRecordDao } from '@src/access/daos/DeclaredCloudflareDomainDnsRecordDao';
export { DeclaredCloudflareDomainRegistrationDao } from '@src/access/daos/DeclaredCloudflareDomainRegistrationDao';
export { DeclaredCloudflareDomainRuleRedirectDao } from '@src/access/daos/DeclaredCloudflareDomainRuleRedirectDao';
export { DeclaredCloudflareDomainZoneDao } from '@src/access/daos/DeclaredCloudflareDomainZoneDao';
// cloudflare sdk utilities
export {
  createCloudflareClient,
  getCloudflareClient,
} from '@src/access/sdks/getCloudflareClient';
// cloudflare domain objects
export type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
export { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
export { DeclaredCloudflareDomainDnsRecordSettings } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordSettings';
export type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';
export { DeclaredCloudflareDomainRegistrantContact } from '@src/domain.objects/DeclaredCloudflareDomainRegistrantContact';
export { DeclaredCloudflareDomainRegistration } from '@src/domain.objects/DeclaredCloudflareDomainRegistration';
export { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';
export {
  RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
  RULE_REDIRECT_SPEC_ROOT_TO_WWW,
} from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirectPresets';
export {
  DeclaredCloudflareDomainRuleRedirectAction,
  DeclaredCloudflareDomainRuleRedirectSpec,
  DeclaredCloudflareDomainRuleRedirectTarget,
  DeclaredCloudflareDomainRuleRedirectTargetUrl,
} from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirectSpec';
export { DeclaredCloudflareDomainTransferIn } from '@src/domain.objects/DeclaredCloudflareDomainTransferIn';
export { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
export type { DeclastructCloudflareProvider } from '@src/domain.objects/DeclastructCloudflareProvider';
// cloudflare dns record operations
export { delDomainDnsRecord } from '@src/domain.operations/domainDnsRecord/delDomainDnsRecord';
export { getAllDomainDnsRecords } from '@src/domain.operations/domainDnsRecord/getAllDomainDnsRecords';
export { getOneDomainDnsRecord } from '@src/domain.operations/domainDnsRecord/getOneDomainDnsRecord';
export { setDomainDnsRecord } from '@src/domain.operations/domainDnsRecord/setDomainDnsRecord';
// cloudflare domain registration operations
export { getAllDomainRegistrations } from '@src/domain.operations/domainRegistration/getAllDomainRegistrations';
export { getOneDomainRegistration } from '@src/domain.operations/domainRegistration/getOneDomainRegistration';
export { setDomainRegistration } from '@src/domain.operations/domainRegistration/setDomainRegistration';
// cloudflare redirect rule operations
export { delDomainRuleRedirect } from '@src/domain.operations/domainRuleRedirect/delDomainRuleRedirect';
export { getAllDomainRuleRedirects } from '@src/domain.operations/domainRuleRedirect/getAllDomainRuleRedirects';
export { getOneDomainRuleRedirect } from '@src/domain.operations/domainRuleRedirect/getOneDomainRuleRedirect';
export { setDomainRuleRedirect } from '@src/domain.operations/domainRuleRedirect/setDomainRuleRedirect';
// cloudflare zone operations
export { delDomainZone } from '@src/domain.operations/domainZone/delDomainZone';
export { getAllDomainZones } from '@src/domain.operations/domainZone/getAllDomainZones';
export { getOneDomainZone } from '@src/domain.operations/domainZone/getOneDomainZone';
export { setDomainZone } from '@src/domain.operations/domainZone/setDomainZone';
// cloudflare provider
export { getDeclastructCloudflareProvider } from '@src/domain.operations/provider/getDeclastructCloudflareProvider';
