import { DeclaredCloudflareDomainDnsRecordSettings } from './DeclaredCloudflareDomainDnsRecordSettings';

describe('DeclaredCloudflareDomainDnsRecordSettings', () => {
  it('should be instantiable with all optional properties', () => {
    const settings = new DeclaredCloudflareDomainDnsRecordSettings({
      ipv4Only: true,
      ipv6Only: false,
      flattenCname: true,
    });
    expect(settings.ipv4Only).toEqual(true);
    expect(settings.ipv6Only).toEqual(false);
    expect(settings.flattenCname).toEqual(true);
  });

  it('should be instantiable with no properties', () => {
    const settings = new DeclaredCloudflareDomainDnsRecordSettings({});
    expect(settings.ipv4Only).toBeUndefined();
    expect(settings.ipv6Only).toBeUndefined();
    expect(settings.flattenCname).toBeUndefined();
  });

  it('should be instantiable with partial properties', () => {
    const settings = new DeclaredCloudflareDomainDnsRecordSettings({
      flattenCname: true,
    });
    expect(settings.flattenCname).toEqual(true);
    expect(settings.ipv4Only).toBeUndefined();
  });
});
