import type { WhoisGetResponse } from 'cloudflare/resources/intel/whois';

import { castIntoDeclaredCloudflareDomainWhoisRecord } from './castIntoDeclaredCloudflareDomainWhoisRecord';

describe('castIntoDeclaredCloudflareDomainWhoisRecord', () => {
  it('should cast a registered domain response', () => {
    const input: WhoisGetResponse = {
      domain: 'example.com',
      found: true,
      dnssec: false,
      extension: 'com',
      punycode: 'example.com',
      nameservers: ['ns1.example.com', 'ns2.example.com'],
      registrant: 'REDACTED FOR PRIVACY',
      registrar: 'GODADDY.COM, LLC',
      registrar_name: 'GoDaddy',
      created_date: '2020-01-01T00:00:00Z',
      expiration_date: '2025-01-01T00:00:00Z',
    };

    const result = castIntoDeclaredCloudflareDomainWhoisRecord(input);

    expect(result.domain).toBe('example.com');
    expect(result.found).toBe(true);
    expect(result.registrar).toBe('GODADDY.COM, LLC');
    expect(result.registrarName).toBe('GoDaddy');
    expect(result.createdDate).toBe('2020-01-01T00:00:00Z');
    expect(result.expirationDate).toBe('2025-01-01T00:00:00Z');
    expect(result.nameservers).toEqual(['ns1.example.com', 'ns2.example.com']);
  });

  it('should cast an unregistered domain response', () => {
    const input: WhoisGetResponse = {
      domain: 'available-domain.xyz',
      found: false,
      dnssec: false,
      extension: 'xyz',
      punycode: 'available-domain.xyz',
      nameservers: [],
      registrant: '',
      registrar: '',
    };

    const result = castIntoDeclaredCloudflareDomainWhoisRecord(input);

    expect(result.domain).toBe('available-domain.xyz');
    expect(result.found).toBe(false);
    expect(result.registrar).toBeNull();
    expect(result.registrarName).toBeNull();
    expect(result.createdDate).toBeNull();
    expect(result.expirationDate).toBeNull();
    expect(result.nameservers).toEqual([]);
  });

  it('should handle absent optional fields', () => {
    const input: WhoisGetResponse = {
      domain: 'example.com',
      found: true,
      dnssec: false,
      extension: 'com',
      punycode: 'example.com',
      nameservers: ['ns1.example.com'],
      registrant: 'REDACTED',
      registrar: 'UNKNOWN REGISTRAR',
      // no registrar_name, created_date, expiration_date
    };

    const result = castIntoDeclaredCloudflareDomainWhoisRecord(input);

    expect(result.domain).toBe('example.com');
    expect(result.found).toBe(true);
    expect(result.registrar).toBe('UNKNOWN REGISTRAR');
    expect(result.registrarName).toBeNull();
    expect(result.createdDate).toBeNull();
    expect(result.expirationDate).toBeNull();
  });
});
