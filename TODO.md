# TODO

- [x] secure user passwords (bcrypt)
- [x] /token, /authorize routing
- [x] authenticate
- [x] bug in stored procedure getClient
- [x] users - lastSignInAt, lastSignOutAt
- [x] secure token - hash refreshtoken
- [x] secure clientSecret - bcrypt clientSecret
- [x] revoketoken check that token is always destroyed
- [x] update mongoose model
- [x] set trust-proxy, logging ips
- [x] fix rememberMe setting
- [x] _login_ config (login.successUri) set default redirect Uri
- [x] _logout_ using logout token
      - redirect after logout
      - document
- [x] CSRF protection
- [x] client for complete flow
- [x] test running with mongo
- [ ] renew refreshToken for every new accessToken
- [ ] scopes / model verifyScope, validateScope
- [ ] review API
- [ ] user registration
- [ ] user password forgotten
- [ ] user settings
- [ ] client registration, obtain new secret, delete
      authorizationURL, tokenURL, callbackURL => clientID, clientSecret
- [ ] ?? allow using passport strategies in LoginMw
- [ ] documentation
- [ ] test running with stored procedures
- [ ] delete with stored procedure. Performance?

