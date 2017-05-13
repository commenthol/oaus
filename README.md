
## Running behind proxy or load-balancer

If running behind a proxy or load-balancer which terminates the SSL connection
this component should add a `X-SSL` header to the request to flag cookies `secure`.

> TODO trusted IPs

# Links

- [rfc6749](https://tools.ietf.org/html/rfc6749)
- [rfc6750](https://tools.ietf.org/html/rfc6750)
- [Introduction to OAuth2](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)
- https://github.com/oauthjs/node-oauth2-server

Scopes

- https://developer.github.com/v3/oauth/
- https://developers.google.com/identity/protocols/googlescopes
- https://www.brandur.org/oauth-scope
