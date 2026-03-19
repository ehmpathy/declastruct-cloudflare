import { DeclaredCloudflareDomainWhoisRecord } from './DeclaredCloudflareDomainWhoisRecord';

describe('DeclaredCloudflareDomainWhoisRecord', () => {
  it('should be instantiable with registered domain data', () => {
    const record = new DeclaredCloudflareDomainWhoisRecord({
      domain: 'example.com',
      found: true,
      registrar: 'GODADDY.COM, LLC',
      registrarName: 'GoDaddy',
      createdDate: '2020-01-01T00:00:00Z',
      expirationDate: '2025-01-01T00:00:00Z',
      nameservers: ['ns1.example.com', 'ns2.example.com'],
    });

    expect(record.domain).toBe('example.com');
    expect(record.found).toBe(true);
    expect(record.registrar).toBe('GODADDY.COM, LLC');
    expect(record.registrarName).toBe('GoDaddy');
    expect(record.createdDate).toBe('2020-01-01T00:00:00Z');
    expect(record.expirationDate).toBe('2025-01-01T00:00:00Z');
    expect(record.nameservers).toEqual(['ns1.example.com', 'ns2.example.com']);
  });

  it('should be instantiable with unregistered domain data', () => {
    const record = new DeclaredCloudflareDomainWhoisRecord({
      domain: 'available-domain.com',
      found: false,
      registrar: null,
      registrarName: null,
      createdDate: null,
      expirationDate: null,
      nameservers: [],
    });

    expect(record.domain).toBe('available-domain.com');
    expect(record.found).toBe(false);
    expect(record.registrar).toBeNull();
    expect(record.registrarName).toBeNull();
    expect(record.nameservers).toEqual([]);
  });

  it('should be instantiable with partial data', () => {
    const record = new DeclaredCloudflareDomainWhoisRecord({
      domain: 'example.com',
      found: true,
      registrar: 'UNKNOWN REGISTRAR',
      registrarName: null, // registrar name not available
      createdDate: null,
      expirationDate: '2025-01-01T00:00:00Z',
      nameservers: ['ns1.example.com'],
    });

    expect(record.domain).toBe('example.com');
    expect(record.found).toBe(true);
    expect(record.registrar).toBe('UNKNOWN REGISTRAR');
    expect(record.registrarName).toBeNull();
    expect(record.createdDate).toBeNull();
    expect(record.expirationDate).toBe('2025-01-01T00:00:00Z');
  });
});
