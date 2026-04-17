# declastruct-cloudflare

![test](https://github.com/ehmpathy/declastruct-cloudflare/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/declastruct-cloudflare/workflows/publish/badge.svg)

Declarative control of Cloudflare resource constructs, via [declastruct](https://github.com/ehmpathy/declastruct).

Declare the structures you want. Plan to see the changes required. Apply to make it so 🪄


# install

```sh
npm install -s declastruct-cloudflare
```

# credentials

see [howto: cloudflare api tokens and keys](./.agent/repo=.this/role=any/briefs/howto.cloudflare.api-tokens-and-keys.md) for step-by-step instructions.

**required permissions** (as shown in cloudflare dashboard):

- Zone - Zone - Edit
- Zone - DNS - Edit
- Account - Registrar: Domains - Read (Edit is Enterprise-only)

# use via cli

## example.1

### wish ✨

declare the resources you wish to have - and what state you wish them to be in

```ts
import { UnexpectedCodePathError } from 'helpful-errors';

export const getProviders = async (): Promise<DeclastructProvider[]> => [
  getDeclastructAwsProvider(
    {},
    {
      log: console,
    },
  ),
];

export const getResources = async (): Promise<DomainEntity<any>[]> => {
  // declare the resources you wish to construct
};
```

### plan 🔮

plan how to achieve the wish of resources you've declared

this will emit a plan that declares the changes required in order to fulfill the wish

```sh
npx declastruct plan --wish provision/github/resources.ts --output provision/github/.temp/plan.json
```

### apply 🪄

apply the plan to fulfill the wish

this will apply only the changes declared in the plan - and only if this plan is still applicable

```sh
npx declastruct apply --plan provision/github/.temp/plan.json
```