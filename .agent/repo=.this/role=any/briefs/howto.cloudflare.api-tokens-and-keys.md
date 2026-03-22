# howto: cloudflare api tokens and keys

## .what

configure cloudflare authentication for declastruct domain management operations.

## .why

the cloudflare sdk requires authentication. we prefer API tokens (scoped permissions), but some operations require Global API key as a fallback:

- **API Token**: zones, dns records, registrar read
- **Global API Key**: registrar updates (auto_renew, locked, privacy) on non-Enterprise accounts

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

**where to find account id**:
- go to any zone in cloudflare dashboard
- account id is in the right sidebar under "API" section
- or: url format is `dash.cloudflare.com/<account-id>/...`

---

## global api key (fallback for registrar updates)

API tokens cannot update registrar settings (auto_renew, locked, privacy) on non-Enterprise accounts. if you need to update registrar domains, use Global API key as a fallback.

**to get your Global API key:**

1. navigate to https://dash.cloudflare.com/profile/api-tokens
2. scroll to **API Keys** section
3. click **View** next to **Global API Key**
4. copy the key

**environment variables with Global API key:**

```bash
# preferred: API token (for zones, dns)
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

# fallback: Global API key (for registrar updates)
export CLOUDFLARE_API_KEY="your-global-api-key-here"
export CLOUDFLARE_EMAIL="your-cloudflare-email@example.com"
```

**security note**: Global API key has full account access. prefer API tokens where possible; only use Global API key for operations that require it (registrar updates).

**sources**:
- [get global api key](https://developers.cloudflare.com/fundamentals/api/get-started/keys/)
- [registrar domains update api](https://developers.cloudflare.com/api/resources/registrar/subresources/domains/methods/update/)

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
