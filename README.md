# OAus

> A Oauth2 Server implementation with authentification, authorization

## Table of Contents

!toc

## Running behind proxy or load-balancer

If running behind a proxy or load-balancer which terminates the SSL connection
this component should add a `x-forwarded-proto` header with value `https` to the
request, to flag cookies `secure`.

## Example implementation

1.  Run docker container
    ```bash
    ./scripts/docker/mysql.sh
    ```
2.  Start Client & Server
    ```bash
    cd example
    npm run run
    ```
3.  Open <http://localhost:3000> in browser.
    Click on "sign-in" and sign-in as `user@user` with password `user`

## Links

- [rfc6749](https://tools.ietf.org/html/rfc6749)
- [rfc6750](https://tools.ietf.org/html/rfc6750)
- [Introduction to OAuth2](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)
- https://github.com/oauthjs/node-oauth2-server
- https://oauth.net/
- https://www.oauth.com/

- https://github.com/jaredhanson/passport-remember-me
- http://stackoverflow.com/questions/549/the-definitive-guide-to-form-based-website-authentication

## Scopes

- https://developer.github.com/v3/oauth/
- https://developers.google.com/identity/protocols/googlescopes
- https://www.brandur.org/oauth-scope

# Attributions

- oauth logo http://wiki.oauth.net/w/page/12238520/Logo
- CC BY-SA 3.0 http://creativecommons.org/licenses/by-sa/3.0/
