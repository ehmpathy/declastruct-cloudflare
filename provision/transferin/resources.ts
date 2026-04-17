#!/usr/bin/env -S npx tsx

/**
 * .what = declastruct resources for domain transfer-in
 * .why = single command to transfer domains into cloudflare
 *
 * usage:
 *   ENV=test npx declastruct plan \
 *     --wish provision/transferin/resources.ts \
 *     --into provision/transferin/plan.json
 *
 *   ENV=test npx declastruct apply --plan provision/transferin/plan.json
 *
 * inputs:
 *   - reads domains from provision/transferin/inputs/env={env}.json
 *   - env passed via ENV environment variable
 *
 * options:
 *   - EXCLUDE=ineligible.60day: pre-filter domains in 60-day lock via WHOIS
 *     - skips domains with console output
 *     - useful for batch runs when you know some are locked
 *     - without this, all domains are declared and apply gives guidance
 */
import Cloudflare from 'cloudflare';
import { refByUnique } from 'domain-objects';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  DeclaredCloudflareDomainRegistration,
  DeclaredCloudflareDomainZone,
  getDeclastructCloudflareProvider,
} from '../../src/contract/sdks';
import { getAllDomainsByInputEnv } from './infra/getAllDomainsByInputEnv';
import { getCredentials } from './infra/getCredentials';
import { getDomainTransferEligibility } from './infra/getDomainTransferEligibility';

/**
 * .what = get env from ENV
 */
const getEnv = (): string => {
  const env = process.env.ENV;
  if (!env) {
    throw new Error('ENV not set. usage: ENV=test npx declastruct plan ...');
  }
  return env;
};

/**
 * .what = provider configuration for cloudflare
 */
export const getProviders = async () => {
  const env = getEnv();
  const { apiToken, accountId } = getCredentials({ env });

  return [
    await getDeclastructCloudflareProvider(
      { apiToken, accountId },
      { log: console },
    ),
  ];
};

/**
 * .what = resources to create/manage
 * .why = declares zones and registrations for each domain
 *
 * behavior:
 *   - zones always created (needed for NS delegation)
 *   - registrations declared for all domains by default
 *   - with EXCLUDE=ineligible.60day: pre-filters via WHOIS
 */
export const getResources = async () => {
  const env = getEnv();
  const { apiToken, accountId } = getCredentials({ env });
  const inputsDir = join(dirname(fileURLToPath(import.meta.url)), 'inputs');
  const domains = getAllDomainsByInputEnv({ env }, { inputsDir });

  // check if 60-day filter is enabled
  const exclude60day = process.env.EXCLUDE === 'ineligible.60day';

  // create cloudflare client for eligibility checks (only if filter enabled)
  const client = exclude60day ? new Cloudflare({ apiToken }) : null;

  const resources: (
    | DeclaredCloudflareDomainZone
    | DeclaredCloudflareDomainRegistration
  )[] = [];

  for (const domain of domains) {
    // declare zone (always needed for NS delegation)
    const zone = new DeclaredCloudflareDomainZone({
      name: domain,
      type: 'full',
      paused: false,
    });
    resources.push(zone);

    // check eligibility if filter is enabled
    if (client) {
      const eligibility = await getDomainTransferEligibility(
        { domain },
        { client, accountId },
      );

      if (!eligibility.eligible) {
        console.log(
          `⏳ ${domain}: skipped (${eligibility.reason}, ${eligibility.daysLeft} days left, registrar: ${eligibility.registrar})`,
        );
        continue;
      }
    }

    // declare registration (refs zone)
    const registration = new DeclaredCloudflareDomainRegistration({
      id: domain,
      name: domain,
      zone: refByUnique(zone),
      autoRenew: true,
      locked: true,
      privacyProtection: true,
    });
    resources.push(registration);
  }

  return resources;
};
