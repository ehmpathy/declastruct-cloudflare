import { given, then, when } from 'test-fns';

import { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';

describe('castIntoDeclaredCloudflareDomainDnsRecord', () => {
  given('a valid cloudflare DNS record response', () => {
    const mockRecord = {
      id: 'record-123',
      name: 'www.example.com',
      type: 'A',
      content: '192.168.1.1',
      ttl: 3600,
      proxied: true,
      comment: 'Test record',
      tags: ['production'],
      priority: undefined,
      settings: { ipv4_only: true, ipv6_only: false },
      created_on: '2023-01-01T00:00:00Z',
      modified_on: '2023-06-01T00:00:00Z',
      proxiable: true,
    };

    when('cast is called with zone ref by name', () => {
      then('it should return a DeclaredCloudflareDomainDnsRecord', () => {
        const result = castIntoDeclaredCloudflareDomainDnsRecord(mockRecord, {
          name: 'example.com',
        });

        expect(result).toBeInstanceOf(DeclaredCloudflareDomainDnsRecord);
        expect(result.id).toEqual('record-123');
        expect(result.zone).toEqual({ name: 'example.com' });
        expect(result.name).toEqual('www.example.com');
        expect(result.type).toEqual('A');
        expect(result.content).toEqual('192.168.1.1');
        expect(result.ttl).toEqual(3600);
        expect(result.proxied).toEqual(true);
        expect(result.comment).toEqual('Test record');
        expect(result.tags).toEqual(['production']);
        expect(result.settings).toEqual({ ipv4Only: true, ipv6Only: false });
        expect(result.createdOn).toEqual('2023-01-01T00:00:00Z');
        expect(result.modifiedOn).toEqual('2023-06-01T00:00:00Z');
        expect(result.proxiable).toEqual(true);
      });
    });
  });

  given('a DNS record with minimal fields', () => {
    const mockRecord = {
      id: 'record-456',
      name: 'minimal.example.com',
      type: 'CNAME',
      content: undefined,
      ttl: undefined,
      proxied: undefined,
      comment: undefined,
      tags: undefined,
      priority: undefined,
      settings: undefined,
      created_on: '2023-01-01T00:00:00Z',
      modified_on: '2023-06-15T00:00:00Z',
      proxiable: true,
    };

    when('cast is called', () => {
      then('it should use defaults for absent fields', () => {
        const result = castIntoDeclaredCloudflareDomainDnsRecord(mockRecord, {
          name: 'minimal.example.com',
        });

        expect(result.content).toEqual('');
        expect(result.ttl).toEqual(1);
        expect(result.comment).toBeUndefined();
        expect(result.settings).toBeUndefined();
      });
    });
  });

  given('a TXT record', () => {
    const mockRecord = {
      id: 'record-txt',
      name: '_dmarc.example.com',
      type: 'TXT',
      content: 'v=DMARC1; p=none',
      ttl: 1,
      proxied: false,
      comment: 'DMARC policy',
      tags: [],
      priority: undefined,
      settings: undefined,
      created_on: '2023-02-01T00:00:00Z',
      modified_on: '2023-02-01T00:00:00Z',
      proxiable: false,
    };

    when('cast is called', () => {
      then('it should correctly cast TXT record type', () => {
        const result = castIntoDeclaredCloudflareDomainDnsRecord(mockRecord, {
          name: 'example.com',
        });

        expect(result.type).toEqual('TXT');
        expect(result.content).toEqual('v=DMARC1; p=none');
        expect(result.proxied).toEqual(false);
      });
    });
  });

  given('an MX record with priority', () => {
    const mockRecord = {
      id: 'record-mx',
      name: 'example.com',
      type: 'MX',
      content: 'mail.example.com',
      ttl: 3600,
      proxied: false,
      comment: 'Primary mail server',
      tags: [],
      priority: 10,
      settings: undefined,
      created_on: '2023-03-01T00:00:00Z',
      modified_on: '2023-03-01T00:00:00Z',
      proxiable: false,
    };

    when('cast is called', () => {
      then('it should include priority field', () => {
        const result = castIntoDeclaredCloudflareDomainDnsRecord(mockRecord, {
          name: 'example.com',
        });

        expect(result.type).toEqual('MX');
        expect(result.priority).toEqual(10);
        expect(result.content).toEqual('mail.example.com');
      });
    });
  });
});
