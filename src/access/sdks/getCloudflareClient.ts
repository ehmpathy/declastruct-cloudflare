import Cloudflare from 'cloudflare';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';

/**
 * .what = extracts the cloudflare client from context
 * .why = provides consistent access pattern for cloudflare operations
 */
export const getCloudflareClient = (
  context: ContextCloudflareApi,
): Cloudflare => {
  return context.cloudflare.client;
};

/**
 * .what = creates a new cloudflare client from api token
 * .why = enables creating clients for testing or initialization
 */
export const createCloudflareClient = (input: {
  apiToken: string;
}): Cloudflare => {
  return new Cloudflare({
    apiToken: input.apiToken,
  });
};
