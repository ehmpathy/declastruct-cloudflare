# rule.forbid.dobj.bagrefs

## .what

forbid untyped inline object literals (bag refs) for domain object references.

## .why

- bag refs lack type safety
- bag refs require you to recall which properties to pick
- bag refs are fragile and error-prone

## .how

use `refByUnique` or `refByPrimary` — either way, it's clearly typed:

```ts
// bad - untyped bag ref
const record = new DeclaredCloudflareDomainDnsRecord({
  zone: { name: 'mhember.com' },  // untyped bag ref
  // ...
});

// good - have instance, use refByUnique(instance)
const record = new DeclaredCloudflareDomainDnsRecord({
  zone: refByUnique(zone),
  // ...
});

// good - no instance, use RefByUnique.as<typeof Class>({ ... })
const record = new DeclaredCloudflareDomainDnsRecord({
  zone: RefByUnique.as<typeof DeclaredCloudflareDomainZone>({ name: 'mhember.com' }),
  // ...
});
```

## .citations

from `declastruct-github/readme.md`:
```ts
const branchMain = RefByUnique.as<typeof DeclaredGithubBranch>({
  name: 'main',
  repo,  // instance passed directly
});
```

## .enforcement

untyped bag refs for domain object references = blocker
