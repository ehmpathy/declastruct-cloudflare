import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

describe('DeclaredCloudflareDomainZone', () => {
  it('should be instantiable with required properties', () => {
    const zone = new DeclaredCloudflareDomainZone({
      name: 'example.com',
      type: 'full',
    });
    expect(zone.name).toEqual('example.com');
    expect(zone.type).toEqual('full');
  });

  it('should be instantiable with all properties', () => {
    const zone = new DeclaredCloudflareDomainZone({
      id: 'zone-123',
      name: 'example.com',
      type: 'full',
      paused: false,
      status: 'active',
      nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      originalNameservers: ['ns1.original.com', 'ns2.original.com'],
      originalRegistrar: 'Original Registrar Inc',
      createdOn: '2024-01-01T00:00:00Z',
      activatedOn: '2024-01-02T00:00:00Z',
    });
    expect(zone.id).toEqual('zone-123');
    expect(zone.status).toEqual('active');
    expect(zone.nameServers).toEqual([
      'ns1.cloudflare.com',
      'ns2.cloudflare.com',
    ]);
  });

  it('should have correct static properties', () => {
    expect(DeclaredCloudflareDomainZone.primary).toEqual(['id']);
    expect(DeclaredCloudflareDomainZone.unique).toEqual(['name']);
    expect(DeclaredCloudflareDomainZone.metadata).toEqual(['id']);
    expect(DeclaredCloudflareDomainZone.readonly).toContain('status');
    expect(DeclaredCloudflareDomainZone.readonly).toContain('nameServers');
  });

  it('should support partial zone type', () => {
    const zone = new DeclaredCloudflareDomainZone({
      name: 'partial.example.com',
      type: 'partial',
    });
    expect(zone.type).toEqual('partial');
  });

  it('should support secondary zone type', () => {
    const zone = new DeclaredCloudflareDomainZone({
      name: 'secondary.example.com',
      type: 'secondary',
    });
    expect(zone.type).toEqual('secondary');
  });
});
