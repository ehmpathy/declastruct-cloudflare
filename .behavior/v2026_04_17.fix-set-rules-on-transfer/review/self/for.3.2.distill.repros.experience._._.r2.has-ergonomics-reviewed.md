# self-review r2: has-ergonomics-reviewed

## deeper look at hidden friction

### friction point 1: two-package import

users must import from two packages:
```typescript
import { refByUnique } from 'domain-objects';
import { DeclaredCloudflareDomainRuleRedirect, RULE_REDIRECT_SPEC_HTTP_TO_HTTPS } from 'declastruct-cloudflare';
```

**is this friction?** no — this is consistent with DNS records. users who use declastruct-cloudflare already know this pattern. domain-objects is a peer dependency.

**could we improve?** re-export refByUnique from declastruct-cloudflare would reduce imports. however, this violates the principle that domain-objects utilities come from domain-objects. the split is intentional and documented.

**verdict**: holds as non-friction.

### friction point 2: slug vs description mismatch

we use `slug`, cloudflare uses `description`. when users view rules in cloudflare dashboard, they see "description" not "slug".

**is this friction?** potential confusion for users who check dashboard after apply.

**why we chose slug**:
- "slug" is developer-friendly (kebab-case, URL-safe, unique identifier pattern)
- "description" implies freeform text, not identifier
- slug aligns with DNS record name patterns (`name` is the unique key)

**mitigation**: documentation should note that slug maps to cloudflare's description field.

**verdict**: acceptable friction with documentation.

### friction point 3: refByUnique verbosity

```typescript
zone: refByUnique(zone)
```

vs the intuitive:
```typescript
zone: zone
```

**is this friction?** minor friction for new users.

**why refByUnique**:
- extracts only unique keys (name), not full object
- enables references to work before zone has ID
- consistent with domain-objects patterns
- type-safe via RefByUnique<T>

**could we improve?** the pattern is necessary for the declarative model. without it, references would break when zone properties change.

**verdict**: holds. the verbosity serves a purpose (type safety, portability).

### friction point 4: manual array return

```typescript
return [zone, rule1, rule2];
```

users must manually add each resource to the return array.

**is this friction?** minimal — same pattern as DNS records.

**could we improve?** auto-collection would require magic. explicit arrays are clear and composable.

**verdict**: holds as non-friction.

### friction point 5: preset discovery

how do users discover available presets?

**current state**: presets are exported constants. users discover via:
- autocomplete on `RULE_REDIRECT_SPEC_`
- documentation
- type hints

**is this friction?** no — autocomplete makes discovery natural.

**verdict**: holds as non-friction.

## issues found in r2

### issue: slug→description map not documented

**fix needed**: readme should mention that `slug` maps to cloudflare's `description` field.

**where to fix**: in 3.3.1.blueprint.product stone, ensure readme documents this.

**status**: noted for blueprint phase.

## conclusion

ergonomics hold. one minor documentation gap identified (slug→description field translation) to address in blueprint phase.

