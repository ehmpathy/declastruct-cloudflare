import { DeclaredCloudflareDomainRegistrantContact } from './DeclaredCloudflareDomainRegistrantContact';

describe('DeclaredCloudflareDomainRegistrantContact', () => {
  it('should be instantiable with required properties', () => {
    const contact = new DeclaredCloudflareDomainRegistrantContact({
      firstName: 'John',
      lastName: 'Doe',
      organization: 'Acme Corp',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'US',
      phone: '+1.5125551234',
    });
    expect(contact.firstName).toEqual('John');
    expect(contact.lastName).toEqual('Doe');
    expect(contact.organization).toEqual('Acme Corp');
    expect(contact.address).toEqual('123 Main St');
    expect(contact.city).toEqual('Austin');
    expect(contact.state).toEqual('TX');
    expect(contact.zip).toEqual('78701');
    expect(contact.country).toEqual('US');
    expect(contact.phone).toEqual('+1.5125551234');
  });

  it('should be instantiable with optional properties', () => {
    const contact = new DeclaredCloudflareDomainRegistrantContact({
      id: 'contact-123',
      firstName: 'Jane',
      lastName: 'Smith',
      organization: 'Tech Inc',
      address: '456 Oak Ave',
      address2: 'Suite 200',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'US',
      phone: '+1.4155559999',
      fax: '+1.4155558888',
      email: 'jane@tech.com',
    });
    expect(contact.id).toEqual('contact-123');
    expect(contact.address2).toEqual('Suite 200');
    expect(contact.fax).toEqual('+1.4155558888');
    expect(contact.email).toEqual('jane@tech.com');
  });
});
