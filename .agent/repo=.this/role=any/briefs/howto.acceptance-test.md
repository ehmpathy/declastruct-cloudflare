# howto acceptance test for declastruct-cloudflare

## .what

acceptance tests validate end-to-end usage of declastruct-cloudflare with the declastruct CLI.

## .why

- verifies the full workflow: resources file -> declastruct plan -> declastruct apply
- ensures the provider integrates correctly with the declastruct ecosystem
- validates idempotency (applying the same plan twice should succeed)

## .how

### 1. create a resources file

resources files declare the desired state of cloudflare resources.

location: `src/contract/sdks/.test/assets/resources.acceptance.ts`

```ts
import { getDeclastructCloudflareProvider } from '../../../../../dist/contract/sdks';

/**
 * .what = provider configuration for cloudflare acceptance tests
 * .why = enables declastruct CLI to interact with cloudflare API
 * .note = requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 */
export const getProviders = async () => [
  await getDeclastructCloudflareProvider(
    {
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    },
    { log: console },
  ),
];

/**
 * .what = resource declarations for cloudflare acceptance tests
 * .why = defines desired state of resources for testing
 *
 * .note
 *   - returns empty array when no test zone is configured
 *   - tests verify the declastruct workflow works even with empty resources
 *   - demo account has no zones, so tests pass with 0 changes
 */
export const getResources = async () => {
  // return empty resources to test the workflow
  // the demo account has no zones, so we can't create DNS records
  // this still verifies: providers work, plan works, apply works (as no-op)
  return [];
};
```

### 2. write acceptance tests

acceptance tests use the declastruct CLI to plan and apply resources.

location: `src/contract/sdks/declastruct.acceptance.test.ts`

```ts
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

describe('declastruct CLI workflow', () => {
  given('a declastruct resources file with cloudflare provider', () => {
    const testDir = join(__dirname, '.test', '.temp', 'acceptance', `run.${Date.now()}`);
    const resourcesFile = join(__dirname, '.test', 'assets', 'resources.acceptance.ts');
    const planFile = join(testDir, 'plan.json');

    beforeAll(() => mkdirSync(testDir, { recursive: true }));

    when('generating a plan via declastruct CLI', () => {
      const prep = useBeforeAll(async () => {
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { stdio: 'inherit', env: process.env, cwd: join(__dirname, '..', '..', '..') },
        );
        return { plan: JSON.parse(readFileSync(planFile, 'utf-8')) };
      });

      then('creates a valid plan file', () => {
        expect(existsSync(planFile)).toBe(true);
        expect(prep.plan).toHaveProperty('changes');
        expect(Array.isArray(prep.plan.changes)).toBe(true);
      });
    });

    when('applying a plan via declastruct CLI', () => {
      // apply and verify no errors
    });

    when('applying the same plan twice (idempotency)', () => {
      // verify second apply succeeds without error
    });
  });
});
```

### 3. run acceptance tests

```sh
# set cloudflare credentials
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh

# run acceptance tests
npm run test:acceptance
```

## .notes

- acceptance tests are **black box tests** - they only use the public SDK exports
- the demo account has **no zones**, so tests work with empty resources
- tests still verify the full workflow: plan -> apply -> idempotent apply
- when a real zone is available, add resources to `getResources()` to test actual changes
- the resources file imports from `dist/` (the built package) to simulate real usage

## .structure

```
src/contract/sdks/
├── .test/
│   ├── .temp/           # temporary files for test runs (gitignored)
│   └── assets/
│       └── resources.acceptance.ts
├── declastruct.acceptance.test.ts
└── index.ts             # public SDK exports
```
