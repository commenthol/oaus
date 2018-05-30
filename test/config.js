/* eslint no-unused-vars:0 */

const signedToken = require('signed-token')
const passwordHash = require('pbkdf2-password-hash')

const secret = 'NEVER CHANGE SECRETS' // secret for access/ refresh token generation
const signedTokenFn = signedToken(secret) // needs to provide `.create`, `.verify`, `.hmac` methods

const mysql = {
  connector: 'mysql',
  url: 'mysql://root:dev@localhost/oauth2',
  logging: false,
  operatorsAliases: false,
  passwordHash,
  signedTokenFn
}

const mongo = {
  connector: 'mongodb',
  url: 'mongodb://localhost/oauth2',
  passwordHash,
  signedTokenFn
}

const config = {
  database: {}, // database settings see `mysql` or `mongo` above
  oauth2: { // oauth2-server settings
    alwaysIssueNewRefreshToken: false, // each refresh_token grant does not write new refresh_token
    allowEmptyState: true
  },
  login: {
    clientId: 'login',
    clientSecret: 'loginsecret',
    csrfSecret: 'Never ＣＨＡＮＧＥ secrets'
  },
  paths: {
    oauth: '/oauth', // path for oauth requests
    login: '/login', // path for login
    logout: '/login/logout', // path for logout - needs to be a subpath of `login`
    loginSuccess: '/' // default redirect after successful login in case that no redirect URL is given
  }
}

config.mysql = () => {
  config.database = mysql
  return config
}
config.mongo = () => {
  config.database = mongo
  return config
}
config.mysql() // set mysql as default
if (process.env.TEST === 'mongo') {
  config.mongo()
}

module.exports = config
