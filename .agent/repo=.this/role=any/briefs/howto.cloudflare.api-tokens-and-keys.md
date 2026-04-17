# howto: cloudflare api tokens and keys

## .what

configure cloudflare authentication for declastruct domain management operations.

## .why

the cloudflare sdk requires authentication via API tokens with scoped permissions.

**important**: must use **user tokens** (created from My Profile), not account tokens. the Intel API requires user tokens — account tokens return `401 token type token != user`.

---

## user tokens vs account tokens

| type | created from | use case |
|------|--------------|----------|
| **user token** | My Profile > API Tokens | acts on behalf of your user; required for Intel API |
| **account token** | Account > API Tokens | service principal, CI/CD; does NOT work with Intel API |

**sources**:
- [user tokens vs account tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)
- [intel api token issue (community)](https://community.cloudflare.com/t/account-api-token-not-working-for-intel-api/874319)

---

## required permissions

configure these when you create a custom user token:

| permission (as shown in UI) | why |
|-----------------------------|-----|
| Zone - Zone - Edit | create, update, delete zones |
| Zone - DNS - Edit | create, update, delete dns records |
| Account - Registrar: Domains - Admin | list, get, update registrar domains |
| Account - Intel - Read | WHOIS lookups for domain transfer/purchase guidance |

**note**: account-level scope is required for:
- zone creation (`client.zones.create()` uses `account.id`)
- all registrar operations (use `account_id` parameter)
- intel/whois lookups (use `account_id` parameter)

**sources**:
- [cloudflare api token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)

---

## steps to create token

1. navigate to https://dash.cloudflare.com/profile/api-tokens

   **important**: must be from **My Profile**, not Account settings

2. click **Create Token**

3. select **Create Custom Token** (at bottom)

4. configure token:
   - **Token name**: `declastruct-cloudflare` (or similar)
   - **Permissions** (add each row):
     - Zone - Zone - Edit
     - Zone - DNS - Edit
     - Account - Registrar: Domains - Admin
     - Account - Intel - Read
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

## global api key (fallback)

if user tokens do not work for registrar operations, global api key may be required:

1. navigate to https://dash.cloudflare.com/profile/api-tokens
2. scroll to **API Keys** section
3. click **View** next to **Global API Key**
4. authenticate and copy the key

```bash
export CLOUDFLARE_API_KEY="your-global-api-key"
export CLOUDFLARE_EMAIL="your-cloudflare-email"
```

**note**: global api key has full account access. prefer scoped tokens when possible.

**status**: preserved pending confirmation that user tokens with Registrar Admin permission work for all operations.

---

## security notes

- never commit tokens to git
- use environment variables or secret managers
- create separate tokens for dev/prod if needed
- rotate tokens periodically
- use minimal permissions for CI/CD (read-only if possible)
