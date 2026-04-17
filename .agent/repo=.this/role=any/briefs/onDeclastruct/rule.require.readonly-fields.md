# rule.require.readonly-fields

## .what

declastruct compares desired state vs remote state to compute diffs. fields in `static readonly` are excluded from comparison — they're set by the remote system, not by us.

## .why

without `static readonly`:
- declastruct sees remote-only fields as "to be removed"
- plan shows `-` for every field cloudflare sets
- false UPDATE decisions

with `static readonly`:
- declastruct ignores these fields in diff
- plan shows KEEP when no controlled fields changed

## .pattern

### 1. declare readonly fields

```ts
export class DeclaredCloudflareDomainZone
  extends DomainEntity<DeclaredCloudflareDomainZone>
  implements DeclaredCloudflareDomainZone
{
  public static primary = ['id'] as const;
  public static unique = ['name'] as const;
  public static metadata = ['id'] as const;
  public static readonly = [
    'status',
    'nameServers',
    'originalNameservers',
    'originalRegistrar',
    'createdOn',
    'activatedOn',
  ] as const;
}
```

### 2. use null, not undefined

`hasReadonly` requires all readonly fields to have values. use `null` for fields that may not be set yet:

```ts
// bad — undefined fails hasReadonly check
interface DeclaredCloudflareDomainZone {
  activatedOn?: string;  // undefined when pending
}

// good — null satisfies hasReadonly
interface DeclaredCloudflareDomainZone {
  activatedOn: string | null;  // null until activated
}
```

### 3. cast with null fallback

```ts
export const castIntoDeclaredCloudflareDomainZone = (
  input: Zone,
): HasReadonly<typeof DeclaredCloudflareDomainZone> => {
  return assure(
    DeclaredCloudflareDomainZone.as({
      id: assure(input.id, isPresent),
      name: assure(input.name, isPresent),
      // ... settable fields ...

      // readonly fields — use null fallback
      status: validateZoneStatus(input.status),
      nameServers: input.name_servers,
      originalNameservers: input.original_name_servers ?? null,
      originalRegistrar: input.original_registrar ?? null,
      createdOn: input.created_on,
      activatedOn: input.activated_on ?? null,
    }),
    hasReadonly({ of: DeclaredCloudflareDomainZone }),
  );
};
```

## .why null over undefined

| aspect | undefined | null |
|--------|-----------|------|
| hasReadonly | fails — field "absent" | passes — field has value |
| intent | "i forgot to set this" | "this has no value yet" |
| explicit | no | yes |

domain objects should be explicit. `null` says "this field exists but has no value" — that's the truth for `activatedOn` on a pending zone.

## .categories

| category | examples | in readonly? |
|----------|----------|--------------|
| metadata | id, createdOn | yes (also in `static metadata`) |
| status | status, activatedOn | yes |
| computed | nameServers, originalRegistrar | yes |
| settable | name, type, paused | no |

## .enforcement

- readonly field with `?` optional = blocker (use `| null`)
- cast function with `?? undefined` for readonly = blocker (use `?? null`)
- remote-managed field not in `static readonly` = blocker
