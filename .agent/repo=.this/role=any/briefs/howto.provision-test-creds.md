# howto provision test credentials for ehmpaths

## .what

use keyrack to provision test credentials that ehmpath clones can supply to integration tests from their terminals.

## .why

- enables ehmpath clones (agents) to run integration tests autonomously
- no hardcoded credentials in code or env files
- credentials encrypted at rest, decrypted on demand
- shared across ehmpathy repos via ehmpath owner keyrack
- fail-fast when credentials absent (clear guidance)

## .how

### prereq: ehmpath keyrack

the ehmpath keyrack is shared across all ehmpathy repos. initialize it once per machine:

```sh
npx rhachet roles init --repo ehmpathy --role mechanic --init keyrack.ehmpath
```

this creates:
- `~/.ssh/ehmpath` — passwordless ssh key for encryption
- `~/.rhachet/keyrack/keyrack.host.ehmpath.age` — encrypted host manifest

### configure repo-specific keys

each repo declares its required keys in `.agent/keyrack.yml`. fill credentials via:

```sh
rhx keyrack fill --owner ehmpath --env test
```

the fill command:
1. reads required keys from `.agent/keyrack.yml`
2. prompts for each required key (if not already configured)
3. stores in ehmpath keyrack (shared with agents)
4. verifies keys can be fetched back

### integration test setup

integration tests fetch credentials via keyrack:

```typescript
// jest.integration.env.ts
const accountId = execSync(
  'npx rhx keyrack get --owner ehmpath --key CLOUDFLARE_ACCOUNT_ID --env test',
  { encoding: 'utf-8' },
).trim();

process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
```

or use the daemon for faster repeated access:

```typescript
// unlock once at test start
execSync('npx rhx keyrack unlock --owner ehmpath --env test --prikey ~/.ssh/ehmpath');

// get is instant after unlock
const token = execSync(
  'npx rhx keyrack get --owner ehmpath --key CLOUDFLARE_API_TOKEN --env test',
  { encoding: 'utf-8' },
).trim();
```

## .pattern

### .agent/keyrack.yml

declare required credentials per environment:

```yaml
org: ehmpathy

extends:
  - .agent/repo=ehmpathy/role=mechanic/keyrack.yml  # inherit mechanic keys (e.g., github token for push)

env.prod:
  # - AWS_PROFILE

env.test:
  - CLOUDFLARE_ACCOUNT_ID
  - CLOUDFLARE_API_TOKEN
```

the keyrack system reads this manifest and:
1. knows which keys are required for each env
2. can fetch all keys for a given env via `--for repo`
3. fails fast if required keys are absent

## .refresh

when tokens expire:

```sh
# refresh specific key
rhx keyrack fill --owner ehmpath --env test --refresh CLOUDFLARE_API_TOKEN

# refresh all keys
rhx keyrack fill --owner ehmpath --env test --refresh @all
```

## .envs

| env | use case |
|-----|----------|
| `test` | integration tests, local development |
| `prep` | pre-production environments |
| `prod` | production (requires separate approval) |
| `all` | available in all environments |

for test credentials, always use `--env test` to prevent accidental prod usage.

## .security

keyrack provides multiple isolation layers to prevent credential leaks:

| layer | isolation | example |
|-------|-----------|---------|
| **repo** | `.agent/keyrack.yml` allowlist | `--for repo` only returns keys declared in manifest |
| **owner** | separate keyracks per owner | `--owner ehmpath` vs `--owner ahbode` |
| **org** | same owner, different orgs | `AWS_PROFILE` for ehmpathy vs ahbode scoped separately |
| **env** | test vs prep vs prod | `--env test` cannot access `--env prod` keys |

**key guarantees**:
- `--for repo` only returns keys declared in `.agent/keyrack.yml`
- `--key SOME_KEY` blocked if key not in manifest
- keys from other repos, other owners, or other orgs are not accessible

## .see also

- `rhx keyrack fill --help` — fill keyrack command
- `rhx keyrack --help` — full keyrack documentation
- `.agent/repo=ehmpathy/role=mechanic/inits/keyrack.ehmpath.sh` — ehmpath keyrack setup
