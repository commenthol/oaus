# Security Considerations

## OAus

There is currently only support for bearer-tokens following [RFC 6750][].
Security Considerations regarding OAuth2 can be found in [RFC 6819][].

### Access Token

- Is a HMAC sha256 signed token. Requires string `config.database.secret`.
  (See `src/utils/signedToken.js`).
- Has a limited lifetime of 1 hour.
- Default lifetime can be reduced in config.
  E.g. to 15min `config.oauth2.accessTokenLifetime = 60 * 15`
- Lifetime can be set on a per client basis.
- Is stored as HMAC sha256 hash in the database.

### Refresh Token

- Is a HMAC sha256 signed token. Requires string `config.database.secret`.
  (See `src/utils/signedToken.js`).
- Has a limited lifetime of 1 hour.
- Default lifetime can be reduced in config.
  E.g. to 1 week `config.oauth2.refreshTokenLifetime = 60 * 60 * 24 * 7`
- Lifetime can be set on a per client basis.
- Is stored as HMAC sha256 hash in the database.
- A Refresh Token can only be used once for assigning a new Access Token.
  Do not overwrite default setting `alwaysIssueNewRefreshToken=true`
- Every time a new Refresh Token gets saved the `refreshTokenExpiresAt` expiry
  date is now plus refreshTokenLifetime such retriggering the effective time
  without a password grant.

### Authorization Code

- Is a HMAC sha256 signed token. Requires string `config.database.secret`.
  (See `src/utils/signedToken.js`).
- Has a limited lifetime of 5 minutes.
- Default lifetime can be changed in config.
  E.g. to 2 minutes `config.oauth2.authorizationCodeLifetime = 60 * 2`
- Can only be used once, no replay possible.
- Authorization Code Token is stored in plain-text in database.

### Client Secret

- Is unprotected on transmission such TLS is required (as required by RFC-6749).
- May be spoofed by MITM attacks. Therefor HTTP Public Key Pinning is a must.
- Is stored using bcrypt in the database.

### User Password

- Is unprotected on transmission such TLS is required (as required by RFC-6749).
- May be spoofed by MITM attacks. Therefor HTTP Public Key Pinning is a must.
- Is stored using bcrypt in the database.

## CSRF

- `state` parameter is required for Authorization Code Grant and
  Resource Owner Password Credentials Grant. Use a signed token with sufficient
  entropy to prevent against CSRF attacks.
- For the OAus Server use `config.csrfTokenSecret` to set secret.

----

## TODO

- Unbounded tokens 
- Bearer tokens 
- Expiring tokens 
- Grant types 
- No required token type
- No agreement on the goals of an HMAC-enabled token type
- No requirement to implement token expiration
- No guidance on token string size, or any value for that matter
- No strict requirement for registration
- Loose client type definition
- Lack of clear client security properties
- No required grant types
- No guidance on the suitability or applicability of grant types
- No useful support for native applications (but lots of lip service)
- No required client authentication method
- No limits on extensions

[OAuth 2.0 and the Road to Hell]: https://hueniverse.com/oauth-2-0-and-the-road-to-hell-8eec45921529
<!-- The OAuth 2.0 Authorization Framework: Bearer Token Usage -->
[RFC 6750]: https://tools.ietf.org/html/rfc6750
<!-- OAuth 2.0 Threat Model and Security Considerations -->
[RFC 6819]: https://tools.ietf.org/html/rfc6819
