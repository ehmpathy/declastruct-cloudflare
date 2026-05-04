#!/usr/bin/env -S npx tsx

/**
 * .what = declastruct resources for domain management (zones + rules)
 * .why = manage redirect rules on extant domains without transfer
 *
 * usage:
 *   ENV=test npx declastruct plan \
 *     --wish provision/domains/resources.ts \
 *     --into provision/domains/plan.json
 *
 *   ENV=test npx declastruct apply --plan provision/domains/plan.json
 *
 * inputs:
 *   - reads domains from provision/domains/inputs/env={env}.json
 *   - env passed via ENV environment variable
 */
import { refByUnique } from 'domain-objects';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  DeclaredCloudflareDomainRuleRedirect,
  DeclaredCloudflareDomainZone,
  getDeclastructCloudflareProvider,
  RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
  RULE_REDIRECT_SPEC_ROOT_TO_WWW,
} from '../../src/contract/sdks';
import { getAllDomainsByInputEnv } from '../transferin/infra/getAllDomainsByInputEnv';
import { getCredentials } from '../transferin/infra/getCredentials';

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
 * .why = declares zones and redirect rules for each domain
 *
 * .note
 *   - no registration/transfer — just zone + rules management
 *   - assumes zones already extant in cloudflare
 */
export const getResources = async () => {
  const env = getEnv();
  const inputsDir = join(dirname(fileURLToPath(import.meta.url)), 'inputs');
  const domains = getAllDomainsByInputEnv({ env }, { inputsDir });

  const resources: (
    | DeclaredCloudflareDomainZone
    | DeclaredCloudflareDomainRuleRedirect
  )[] = [];

  for (const domain of domains) {
    // declare zone
    const zone = new DeclaredCloudflareDomainZone({
      name: domain,
      type: 'full',
      paused: false,
    });
    resources.push(zone);

    // declare redirect rules
    const redirectHttpToHttps = new DeclaredCloudflareDomainRuleRedirect({
      zone: refByUnique(zone),
      slug: 'redirect-http-to-https',
      spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
      modifiedOn: null,
    });
    resources.push(redirectHttpToHttps);

    const redirectRootToWww = new DeclaredCloudflareDomainRuleRedirect({
      zone: refByUnique(zone),
      slug: 'redirect-root-to-www',
      spec: RULE_REDIRECT_SPEC_ROOT_TO_WWW,
      modifiedOn: null,
    });
    resources.push(redirectRootToWww);

    // test rule to prove CREATE works
    const redirectPlaytest = new DeclaredCloudflareDomainRuleRedirect({
      zone: refByUnique(zone),
      slug: `playtest-${new Date().toISOString().split('T')[0]}`,
      spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
      modifiedOn: null,
    });
    resources.push(redirectPlaytest);
  }

  return resources;
};
