import { DeclaredCloudflareDomainDnsRecord } from './DeclaredCloudflareDomainDnsRecord';
import { DeclaredCloudflareDomainDnsRecordSettings } from './DeclaredCloudflareDomainDnsRecordSettings';
import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

describe('DeclaredCloudflareDomainDnsRecord', () => {
  it('should be instantiable with zone ref by name (unique)', () => {
    const record = new DeclaredCloudflareDomainDnsRecord({
      zone: { name: 'example.com' },
      name: 'api.example.com',
      type: 'A',
      content: '192.168.1.1',
      ttl: 300,
    });
    expect(record.zone).toEqual({ name: 'example.com' });
    expect(record.name).toEqual('api.example.com');
    expect(record.type).toEqual('A');
    expect(record.content).toEqual('192.168.1.1');
    expect(record.ttl).toEqual(300);
  });

  it('should be instantiable with zone ref by id (primary)', () => {
    const record = new DeclaredCloudflareDomainDnsRecord({
      zone: { id: 'zone-123' },
      name: 'www.example.com',
      type: 'CNAME',
      content: 'example.com',
      ttl: 1,
      proxied: true,
    });
    expect(record.zone).toEqual({ id: 'zone-123' });
    expect(record.proxied).toEqual(true);
  });

  it('should be instantiable with all properties', () => {
    const record = new DeclaredCloudflareDomainDnsRecord({
      id: 'record-456',
      zone: { name: 'example.com' },
      name: 'mail.example.com',
      type: 'MX',
      content: 'mail.example.com',
      ttl: 3600,
      proxied: false,
      comment: 'Primary mail server',
      tags: ['mail', 'production'],
      priority: 10,
      settings: { ipv4Only: true },
      createdOn: '2024-01-01T00:00:00Z',
      modifiedOn: '2024-01-02T00:00:00Z',
      proxiable: false,
    });
    expect(record.id).toEqual('record-456');
    expect(record.priority).toEqual(10);
    expect(record.comment).toEqual('Primary mail server');
    expect(record.tags).toEqual(['mail', 'production']);
  });

  it('should have correct static properties', () => {
    expect(DeclaredCloudflareDomainDnsRecord.primary).toEqual(['id']);
    expect(DeclaredCloudflareDomainDnsRecord.unique).toEqual([
      'zone',
      'name',
      'type',
    ]);
    expect(DeclaredCloudflareDomainDnsRecord.metadata).toEqual(['id']);
    expect(DeclaredCloudflareDomainDnsRecord.readonly).toContain('createdOn');
    expect(DeclaredCloudflareDomainDnsRecord.readonly).toContain('modifiedOn');
    expect(DeclaredCloudflareDomainDnsRecord.readonly).toContain('proxiable');
  });

  it('should have nested definitions', () => {
    expect(DeclaredCloudflareDomainDnsRecord.nested.zone).toEqual(
      DeclaredCloudflareDomainZone,
    );
    expect(DeclaredCloudflareDomainDnsRecord.nested.settings).toEqual(
      DeclaredCloudflareDomainDnsRecordSettings,
    );
  });

  it('should support TXT record type', () => {
    const record = new DeclaredCloudflareDomainDnsRecord({
      zone: { name: 'example.com' },
      name: '_dmarc.example.com',
      type: 'TXT',
      content: 'v=DMARC1; p=reject;',
      ttl: 3600,
    });
    expect(record.type).toEqual('TXT');
  });
});
