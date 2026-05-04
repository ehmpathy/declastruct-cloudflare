# howto use cloudflare credentials

## .what

cloudflare credentials for integration/acceptance tests are stored in keyrack under the `ehmpath` owner.

## .why

integration tests and local development require access to the cloudflare api. keyrack provides secure credential storage with automatic environment variable injection.

## .how

unlock credentials via keyrack:

```sh
rhx keyrack unlock --owner ehmpath --env test
```

this unlocks:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

the `rhx git.repo.test` skill automatically unlocks keyrack before test runs.

## .when to use

- run `rhx git.repo.test --what integration` — auto-unlocks keyrack
- run `rhx git.repo.test --what acceptance` — auto-unlocks keyrack
- for manual commands: `rhx keyrack unlock --owner ehmpath --env test && npm run test:integration`

## .examples

```sh
# integration tests (auto-unlocks keyrack)
rhx git.repo.test --what integration

# acceptance tests (auto-unlocks keyrack)
rhx git.repo.test --what acceptance

# manual unlock + raw npm command
rhx keyrack unlock --owner ehmpath --env test && npm run test:integration
```

## .note

credentials are for the shared demo/test account. never use them for production workloads.
