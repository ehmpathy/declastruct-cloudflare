import type { Zone } from 'cloudflare/resources/zones/zones';
import { type HasReadonly, hasReadonly } from 'domain-objects';
import { assure, isPresent } from 'type-fns';

import { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

/**
 * .what = transforms cloudflare SDK Zone to DeclaredCloudflareDomainZone
 * .why = ensures type safety and readonly field enforcement
 */
export const castIntoDeclaredCloudflareDomainZone = (
  input: Zone,
): HasReadonly<typeof DeclaredCloudflareDomainZone> => {
  return assure(
    DeclaredCloudflareDomainZone.as({
      id: assure(input.id, isPresent),
      name: assure(input.name, isPresent),
      type: input.type as 'full' | 'partial' | 'secondary',
      paused: input.paused,
      status: input.status as
        | 'initializing'
        | 'pending'
        | 'active'
        | 'moved'
        | undefined,
      nameServers: input.name_servers,
      originalNameservers: input.original_name_servers ?? undefined,
      originalRegistrar: input.original_registrar ?? undefined,
      createdOn: input.created_on,
      activatedOn: input.activated_on ?? undefined,
    }),
    hasReadonly({ of: DeclaredCloudflareDomainZone }),
  );
};
