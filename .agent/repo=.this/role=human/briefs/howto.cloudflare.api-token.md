# howto: create cloudflare api token

## .what

create a cloudflare api token with permissions for declastruct domain management operations.

## .why

the cloudflare sdk requires an api token to authenticate. the token must have specific permissions to:
- manage zones (create, read, update, delete)
- manage dns records (create, read, update, delete)
- manage registrar domains (read, update settings)

---

## required permissions

| resource | permission | why |
|----------|------------|-----|
| Zone | Zone:Edit | create, update, delete zones |
| Zone | Zone:Read | list, get zones |
| DNS | DNS:Edit | create, update, delete dns records |
| DNS | DNS:Read | list, get dns records |
| Registrar | Registrar:Edit | update domain settings (autoRenew, privacy, locked) |
| Registrar | Registrar:Read | list, get registrar domains |

**note**: account-level scope is required for:
- creating new zones (`client.zones.create()` uses `account.id`)
- all registrar operations (use `account_id` parameter)

---

## steps to create token

1. navigate to https://dash.cloudflare.com/profile/api-tokens

2. click **Create Token**

3. select **Create Custom Token** (at bottom)

4. configure token:
   - **Token name**: `declastruct-cloudflare` (or similar)
   - **Permissions**:
     - Account > Cloudflare Registrar Domains > Edit
     - Zone > Zone > Edit
     - Zone > DNS > Edit
   - **Account Resources**: Include > [your account]
   - **Zone Resources**: Include > All zones (or specific test zone)
   - **TTL**: optional, set expiration if desired

5. click **Continue to summary**

6. click **Create Token**

7. copy the token (shown only once)

---

## environment variables

set these for integration/acceptance tests:

```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"
```

**finding account id**:
- go to any zone in cloudflare dashboard
- account id is in the right sidebar under "API" section
- or: url format is `dash.cloudflare.com/<account-id>/...`

---

## minimal permissions (read-only)

if only running read operations (getOne, getAll):

- Zone > Zone > Read
- Zone > DNS > Read
- Account > Cloudflare Registrar Domains > Read

---

## verification

test token works:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"
```

should return list of zones (or empty array if none exist).

---

## security notes

- never commit tokens to git
- use environment variables or secret managers
- create separate tokens for dev/prod if needed
- rotate tokens periodically
- use minimal permissions for CI/CD (read-only if possible)
