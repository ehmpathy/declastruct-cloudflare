import type Cloudflare from 'cloudflare';

/**
 * .what = context interface for Cloudflare API operations
 * .why = provides Cloudflare client and account configuration to operations
 *
 * .note
 *   - cloudflare client should be instantiated via `new Cloudflare({ apiToken })`
 *   - accountId is required for account-scoped operations (registrar, etc)
 */
export interface ContextCloudflareApi {
  cloudflare: {
    /**
     * .what = the cloudflare sdk client instance
     */
    client: Cloudflare;

    /**
     * .what = the cloudflare account id
     * .why = required for account-level operations like registrar management
     */
    accountId: string;
  };
}
