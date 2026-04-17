import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import util from 'util';

import { keyrack } from 'rhachet/keyrack';

// eslint-disable-next-line no-undef
jest.setTimeout(90000); // since we're calling downstream apis

// set console.log to not truncate nested objects
util.inspect.defaultOptions.depth = 5;

/**
 * .what = verify that we're running from a valid project directory; otherwise, fail fast
 * .why = prevent confusion and hard-to-debug errors from running tests in the wrong directory
 */
if (!existsSync(join(process.cwd(), 'package.json')))
  throw new Error('no package.json found in cwd. are you @gitroot?');

/**
 * .what = source credentials from keyrack for test env when not already set
 * .why =
 *   - auto-inject keys into process.env for local dev
 *   - skip keyrack when credentials already present (e.g., CI with secrets)
 *   - fail fast with helpful error if keyrack locked or keys absent
 */
const keyrackYmlPath = join(process.cwd(), '.agent/keyrack.yml');
const hasCloudflareCredentials =
  process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID;
if (existsSync(keyrackYmlPath) && !hasCloudflareCredentials)
  keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'strict' });

/**
 * sanity check that credentials are available for acceptance tests
 *
 * usecases
 * - prevent silent test failures due to absent credentials
 * - provide clear instructions on how to set up credentials
 */
if (!(process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_API_TOKEN))
  throw new Error(
    'cloudflare credentials not set. Run w/ creds via `rhx keyrack unlock --owner ehmpath --env test && npm run test:acceptance`',
  );

/**
 * .what = verify that the env has sufficient auth to run the tests if aws is used; otherwise, fail fast
 * .why =
 *   - prevent time wasted waiting on tests to fail due to lack of credentials
 *   - prevent time wasted debugging tests which are failing due to hard-to-read missed credential errors
 */
const declapractUsePath = join(process.cwd(), 'declapract.use.yml');
const requiresAwsAuth =
  existsSync(declapractUsePath) &&
  readFileSync(declapractUsePath, 'utf8').includes('awsAccountId');
if (
  requiresAwsAuth &&
  !(process.env.AWS_PROFILE || process.env.AWS_ACCESS_KEY_ID)
)
  throw new Error(
    'no aws credentials present. please authenticate with aws to run acceptance tests',
  );
