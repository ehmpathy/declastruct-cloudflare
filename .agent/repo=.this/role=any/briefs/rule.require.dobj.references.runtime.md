# rule.require.references.runtime

## .what

runtime references must use `refByUnique` or `refByPrimary` from `domain-objects`.

## .why

- extracts only the correct key properties from instances
- no one should need to recall which properties to pick
- pit of success: impossible to create malformed refs

## .how

### refByUnique

extracts unique key properties from an instance:

```ts
import { refByUnique } from 'domain-objects';

const zone = new DeclaredCloudflareDomainZone({
  id: 'abc123',
  name: 'mhember.com',
  type: 'full'
});

const zoneRef = refByUnique<typeof DeclaredCloudflareDomainZone>(zone);
// zoneRef = { name: 'mhember.com' }
```

### refByPrimary

extracts primary key properties from an instance:

```ts
import { refByPrimary } from 'domain-objects';

const zoneRef = refByPrimary<typeof DeclaredCloudflareDomainZone>(zone);
// zoneRef = { id: 'abc123' }
```

## .examples

```ts
// good — use refByUnique
const zoneRef = refByUnique<typeof DeclaredCloudflareDomainZone>(zone);

// good — use refByPrimary
const zoneRef = refByPrimary<typeof DeclaredCloudflareDomainZone>(zone);

// bad — manual property extraction
const zoneRef = { name: zone.name };  // fragile, error-prone
```

## .enforcement

runtime refs via manual property extraction = blocker
