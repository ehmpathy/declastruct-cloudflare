# rule.require.references.devtime

## .what

devtime references must use `RefByUnique`, `RefByPrimary`, or `Ref` from `domain-objects`.

## .why

- intellisense shows exactly what properties are needed
- no one should need to recall how to reference a zone
- pit of success: impossible to create malformed refs

## .how

### RefByUnique (most common)

use when the property references by unique key:

```ts
import { DomainEntity, RefByUnique } from 'domain-objects';

interface DeclaredCloudflareDomainDnsRecord {
  zone: RefByUnique<typeof DeclaredCloudflareDomainZone>;  // { name: string }
  name: string;
  type: DeclaredCloudflareDomainDnsRecordType;
}
```

when you type `zone: { `, intellisense shows `name` — the unique key.

### RefByPrimary

use when the property references by primary key:

```ts
interface SomeEntity {
  zone: RefByPrimary<typeof DeclaredCloudflareDomainZone>;  // { id: string }
}
```

### Ref (union)

use in operation inputs when either primary or unique is acceptable:

```ts
const getOneDomainZone = async (input: {
  by: PickOne<{
    primary: { id: string };
    unique: { name: string };
    ref: Ref<typeof DeclaredCloudflareDomainZone>;  // accepts either
  }>;
}) => { ... };
```

## .examples

```ts
// good — RefByUnique in domain object
interface DeclaredCloudflareDomainDnsRecord {
  zone: RefByUnique<typeof DeclaredCloudflareDomainZone>;
}

// good — Ref in operation input
const expandZoneRef = async (
  zoneRef: Ref<typeof DeclaredCloudflareDomainZone>,
) => { ... };

// bad — inline shape without type
interface BadExample {
  zone: { name: string };  // loses type safety
}
```

## .enforcement

devtime refs without `RefByUnique`, `RefByPrimary`, or `Ref` = blocker
