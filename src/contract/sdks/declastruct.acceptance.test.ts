import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getSampleCloudflareApiContext } from '../../.test/getSampleCloudflareApiContext';
import { delDomainRuleRedirect } from '../../domain.operations/domainRuleRedirect/delDomainRuleRedirect';

// set stable slug once at test start (prevents Date.now() drift between CLI invocations)
const ACCEPTANCE_TEST_SLUG = `acceptance-test-${Date.now()}`;
process.env.ACCEPTANCE_TEST_SLUG = ACCEPTANCE_TEST_SLUG;

/**
 * .what = acceptance tests for declastruct-cloudflare via CLI
 * .why = verifies end-to-end workflow: resources file -> declastruct plan -> declastruct apply
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests the full declastruct CLI workflow as a black box
 *   - validates idempotency via double apply
 *   - uses sunshineoceansurferturtles.com test zone
 */
describe('declastruct CLI workflow', () => {
  // fail-fast if credentials not configured
  if (!process.env.CLOUDFLARE_API_TOKEN)
    BadRequestError.throw(
      'CLOUDFLARE_API_TOKEN not set. run: rhx keyrack unlock --owner ehmpath --env test',
    );
  if (!process.env.CLOUDFLARE_ACCOUNT_ID)
    BadRequestError.throw(
      'CLOUDFLARE_ACCOUNT_ID not set. run: rhx keyrack unlock --owner ehmpath --env test',
    );

  // setup test paths
  const testDir = join(
    __dirname,
    '.test',
    '.temp',
    'acceptance',
    `run.${new Date().toISOString().replace(/[:.]/g, '-')}`,
  );
  const resourcesFile = join(
    __dirname,
    '.test',
    'assets',
    'resources.acceptance.ts',
  );
  const planFile = join(testDir, 'plan.json');

  // ensure test directory exists
  beforeAll(() => mkdirSync(testDir, { recursive: true }));

  // cleanup test resources after all tests
  afterAll(async () => {
    const context = getSampleCloudflareApiContext();
    await delDomainRuleRedirect(
      {
        zone: { name: 'sunshineoceansurferturtles.org' },
        by: { unique: { slug: ACCEPTANCE_TEST_SLUG } },
      },
      context,
    );
  });

  given('a declastruct resources file with cloudflare provider', () => {
    when('[t0] generating a plan via declastruct CLI', () => {
      const prep = useBeforeAll(async () => {
        // run declastruct plan command
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          {
            stdio: 'inherit',
            env: process.env,
            cwd: join(__dirname, '..', '..', '..'),
          },
        );

        // read and parse the plan
        const planContent = readFileSync(planFile, 'utf-8');
        const plan = JSON.parse(planContent);
        return { plan };
      });

      then('creates a valid plan file', () => {
        expect(existsSync(planFile)).toBe(true);
      });

      then('plan has expected structure with changes array', () => {
        expect(prep.plan).toHaveProperty('changes');
        expect(Array.isArray(prep.plan.changes)).toBe(true);
      });

      then('plan has changes for configured resources', () => {
        // resources include: zone, dns record, 3 redirect rules
        //   - zone is KEEP or UPDATE (already exists)
        //   - dns record may be CREATE or KEEP
        //   - 2 redirect rules are KEEP (stable slugs)
        //   - 1 redirect rule is CREATE (timestamped slug)
        expect(prep.plan.changes.length).toBeGreaterThanOrEqual(1);
      });

      then('plan includes CREATE action for timestamped redirect rule', () => {
        const createActions = prep.plan.changes.filter(
          (c: { action: string }) => c.action === 'CREATE',
        );
        expect(createActions.length).toBeGreaterThanOrEqual(1);

        // verify at least one CREATE is for a redirect rule
        const createRedirectRule = createActions.find(
          (c: { forResource: { class: string } }) =>
            c.forResource?.class === 'DeclaredCloudflareDomainRuleRedirect',
        );
        expect(createRedirectRule).toBeDefined();
      });

      then('plan structure matches snapshot', () => {
        // snapshot captures plan shape for regression detection
        // mask dynamic fields (ids, timestamps) for stable comparison
        const planForSnapshot = {
          changes: prep.plan.changes.map(
            (change: { action: string; forResource: { class: string } }) => ({
              action: change.action,
              resourceClass: change.forResource?.class,
            }),
          ),
        };
        expect(planForSnapshot).toMatchSnapshot();
      });
    });

    when('[t1] applying a plan via declastruct CLI', () => {
      const prep = useBeforeAll(async () => {
        // first generate a fresh plan
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          {
            stdio: 'inherit',
            env: process.env,
            cwd: join(__dirname, '..', '..', '..'),
          },
        );

        // apply the plan
        execSync(`npx declastruct apply --plan ${planFile}`, {
          stdio: 'inherit',
          env: process.env,
          cwd: join(__dirname, '..', '..', '..'),
        });

        // read the plan to verify what was applied
        const planContent = readFileSync(planFile, 'utf-8');
        const plan = JSON.parse(planContent);
        return { plan };
      });

      then('apply completes and plan has changes array', () => {
        expect(prep.plan).toHaveProperty('changes');
        expect(Array.isArray(prep.plan.changes)).toBe(true);
      });

      then('applied plan structure matches snapshot', () => {
        // snapshot captures applied plan shape for regression detection
        const planForSnapshot = {
          changes: prep.plan.changes.map(
            (change: { action: string; forResource: { class: string } }) => ({
              action: change.action,
              resourceClass: change.forResource?.class,
            }),
          ),
        };
        expect(planForSnapshot).toMatchSnapshot();
      });
    });

    when('[t2] applying the same plan twice (idempotency)', () => {
      then('second apply succeeds without error', async () => {
        // generate plan
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          {
            stdio: 'inherit',
            env: process.env,
            cwd: join(__dirname, '..', '..', '..'),
          },
        );

        // first apply
        execSync(`npx declastruct apply --plan ${planFile}`, {
          stdio: 'inherit',
          env: process.env,
          cwd: join(__dirname, '..', '..', '..'),
        });

        // regenerate plan after first apply
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          {
            stdio: 'inherit',
            env: process.env,
            cwd: join(__dirname, '..', '..', '..'),
          },
        );

        // second apply should succeed (idempotent)
        execSync(`npx declastruct apply --plan ${planFile}`, {
          stdio: 'inherit',
          env: process.env,
          cwd: join(__dirname, '..', '..', '..'),
        });
      });
    });
  });
});
