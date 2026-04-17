import type { Zone } from 'cloudflare/resources/zones/zones';
import { type HasReadonly, hasReadonly } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import { assure, isPresent } from 'type-fns';

import { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

const ZONE_TYPES = ['full', 'partial', 'secondary'] as const;
type ZoneType = (typeof ZONE_TYPES)[number];

const ZONE_STATUSES = ['initializing', 'pending', 'active', 'moved'] as const;
type ZoneStatus = (typeof ZONE_STATUSES)[number];

/**
 * .what = transforms cloudflare SDK Zone to DeclaredCloudflareDomainZone
 * .why = ensures type safety and readonly field enforcement
 */
/**
 * .what = validates zone type from API response
 */
const validateZoneType = (type: string | undefined): ZoneType => {
  if (!type || !ZONE_TYPES.includes(type as ZoneType))
    throw new UnexpectedCodePathError('invalid zone type from API', { type });
  return type as ZoneType;
};

/**
 * .what = validates zone status from API response
 */
const validateZoneStatus = (
  status: string | undefined,
): ZoneStatus | undefined => {
  if (status === undefined) return undefined;
  if (!ZONE_STATUSES.includes(status as ZoneStatus))
    throw new UnexpectedCodePathError('invalid zone status from API', {
      status,
    });
  return status as ZoneStatus;
};

export const castIntoDeclaredCloudflareDomainZone = (
  input: Zone,
): HasReadonly<typeof DeclaredCloudflareDomainZone> => {
  return assure(
    DeclaredCloudflareDomainZone.as({
      id: assure(input.id, isPresent),
      name: assure(input.name, isPresent),
      type: validateZoneType(input.type),
      paused: input.paused,
      status: validateZoneStatus(input.status),
      nameServers: input.name_servers,
      original:
        input.original_name_servers || input.original_registrar
          ? {
              nameservers: input.original_name_servers ?? null,
              registrar: input.original_registrar ?? null,
            }
          : null,
      createdOn: input.created_on,
      activatedOn: input.activated_on ?? null,
    }),
    hasReadonly({ of: DeclaredCloudflareDomainZone }),
  );
};
