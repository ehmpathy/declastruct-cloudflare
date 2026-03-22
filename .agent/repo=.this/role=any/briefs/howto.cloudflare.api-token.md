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

configure these in the cloudflare dashboard when you create a custom token:

| permission (as shown in UI) | why |
|-----------------------------|-----|
| Zone - Zone - Edit | create, update, delete zones |
| Zone - DNS - Edit | create, update, delete dns records |
| Account - Registrar: Domains - Read | list, get registrar domains |

**limitation**: Registrar Edit permissions are only available for Enterprise accounts or via Global API key. Non-Enterprise accounts are limited to Read-only access for registrar operations via API tokens.

**note**: account-level scope is required for:
- zone creation (`client.zones.create()` uses `account.id`)
- all registrar operations (use `account_id` parameter)

**sources**:
- [cloudflare api token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [registrar api token permissions (community)](https://community.cloudflare.com/t/domain-registrar-api-token-permissions/450561)
- [register domains with cloudflare registrar api (community)](https://community.cloudflare.com/t/register-and-manage-domains-with-cloudflare-registrar-api/453793)

---

## steps to create token

1. navigate to https://dash.cloudflare.com/profile/api-tokens

2. click **Create Token**

3. select **Create Custom Token** (at bottom)

4. configure token:
   - **Token name**: `declastruct-cloudflare` (or similar)
   - **Permissions** (add each row):
     - Zone - Zone - Edit
     - Zone - DNS - Edit
     - Account - Registrar: Domains - Read
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

if you only need read operations (getOne, getAll):

- Zone - Zone - Read
- Zone - DNS - Read
- Account - Registrar: Domains - Read

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
