import { DeclaredCloudflareDomainTransferIn } from './DeclaredCloudflareDomainTransferIn';

describe('DeclaredCloudflareDomainTransferIn', () => {
  it('should be instantiable with all properties', () => {
    const transferIn = new DeclaredCloudflareDomainTransferIn({
      acceptFoa: 'needed',
      approveTransfer: 'pending',
      canCancelTransfer: 'true',
      disablePrivacy: 'completed',
      enterAuthCode: 'needed',
      unlockDomain: 'completed',
    });
    expect(transferIn.acceptFoa).toEqual('needed');
    expect(transferIn.approveTransfer).toEqual('pending');
    expect(transferIn.canCancelTransfer).toEqual('true');
    expect(transferIn.disablePrivacy).toEqual('completed');
    expect(transferIn.enterAuthCode).toEqual('needed');
    expect(transferIn.unlockDomain).toEqual('completed');
  });

  it('should be instantiable with completed transfer status', () => {
    const transferIn = new DeclaredCloudflareDomainTransferIn({
      acceptFoa: 'completed',
      approveTransfer: 'completed',
      canCancelTransfer: 'false',
      disablePrivacy: 'completed',
      enterAuthCode: 'completed',
      unlockDomain: 'completed',
    });
    expect(transferIn.acceptFoa).toEqual('completed');
    expect(transferIn.approveTransfer).toEqual('completed');
  });
});
