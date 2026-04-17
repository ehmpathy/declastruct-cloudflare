# howto use cloudflare demo credentials

## .what

the `use.demo.cloudflare.creds.sh` skill sets up cloudflare api credentials for local development and testing.

## .why

integration tests and local development require access to the cloudflare api. this skill provides a demo account's credentials so you can run tests without configuring your own.

## .how

**important**: this script must be `source`d, not executed directly. this allows it to export environment variables into your current shell session.

```sh
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh
```

## .what it does

1. exports `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` to your shell
2. verifies the token works by calling the cloudflare api
3. prints confirmation of success or failure

## .when to use

- before running integration tests that hit cloudflare api
- before running acceptance tests
- during local development when testing cloudflare operations

## .example

for human terminals (persistent shell session):
```sh
# set up credentials
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh

# now run tests
npm run test:integration
```

for agents like claude (isolated bash sessions):
```sh
# must chain on single line - each Bash call is isolated
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh && npm run test:integration
```

## .gotchas

### must be sourced

```sh
# bad - won't work, variables stay in subshell
./.agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh

# good - exports to current shell
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh
```

### credentials are for demo account only

these credentials are for the shared demo/test account. never use them for production workloads.

### agent sessions are isolated

claude and other agents execute each Bash command in an isolated session. environment variables don't persist between calls. always chain source with your command:

```sh
# bad - credentials lost after first command ends
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh
npm run test:integration  # CLOUDFLARE_API_TOKEN is undefined here

# good - same session, credentials available
source .agent/repo=.this/role=any/skills/use.demo.cloudflare.creds.sh && npm run test:integration
```
