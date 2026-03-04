import { DomainLiteral } from 'domain-objects';

/**
 * .what = transfer status indicators for domain transfers
 * .why = enables tracking of domain transfer progress
 *
 * .note = dashboard-writable only - transfer actions taken via dashboard/email
 */
export interface DeclaredCloudflareDomainTransferIn {
  /**
   * .what = foa acceptance status
   */
  acceptFoa: string;

  /**
   * .what = transfer approval status
   */
  approveTransfer: string;

  /**
   * .what = whether transfer can be cancelled
   */
  canCancelTransfer: string;

  /**
   * .what = privacy disable status
   */
  disablePrivacy: string;

  /**
   * .what = auth code entry status
   */
  enterAuthCode: string;

  /**
   * .what = domain unlock status
   */
  unlockDomain: string;
}

export class DeclaredCloudflareDomainTransferIn
  extends DomainLiteral<DeclaredCloudflareDomainTransferIn>
  implements DeclaredCloudflareDomainTransferIn {}
