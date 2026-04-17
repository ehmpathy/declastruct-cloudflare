import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';

/**
 * .what = creates a mocked cloudflare API context for unit testing
 * .why = provides sync context with mock client for tests that mock cloudflare SDK
 *
 * .note
 *   - client is a mock object; cast as needed for specific test scenarios
 *   - accountId is a fake id for testing
 */
export const getMockedCloudflareApiContext = (): ContextCloudflareApi &
  ContextLogTrail => ({
  cloudflare: {
    client: {} as ContextCloudflareApi['cloudflare']['client'],
    accountId: 'mock-account-id-123',
  },
  log: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
});
