import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance tests for declastruct-cloudflare via CLI
 * .why = verifies end-to-end workflow: resources file -> declastruct plan -> declastruct apply
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests the full declastruct CLI workflow as a black box
 *   - validates idempotency by applying the same plan twice
 *   - works with empty resources (demo account has no zones)
 */
describe('declastruct CLI workflow', () => {
  // fail-fast if credentials not configured
  if (!process.env.CLOUDFLARE_API_TOKEN)
    BadRequestError.throw(
      'CLOUDFLARE_API_TOKEN not set. run: source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh',
    );
  if (!process.env.CLOUDFLARE_ACCOUNT_ID)
    BadRequestError.throw(
      'CLOUDFLARE_ACCOUNT_ID not set. run: source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh',
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

      then('plan has no changes (empty resources)', () => {
        expect(prep.plan.changes).toHaveLength(0);
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

      then('apply completes without error', () => {
        // if we reach here, apply succeeded
        expect(true).toBe(true);
      });

      then('plan file contains changes array', () => {
        expect(prep.plan).toHaveProperty('changes');
        expect(Array.isArray(prep.plan.changes)).toBe(true);
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
