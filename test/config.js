/* eslint no-unused-vars:0 */

const mysql = {
  connector: 'mysql',
  url: 'mysql://dev:dev@localhost/oauth2',
  logging: false,
  storedProcedures: true
}

const mongo = {
  connector: 'mongodb',
  url: 'mongodb://localhost/oauth2'
}
const SECRET = 'NEVER CHANGE SECRETS'
const config = {
  database: {   // database settings
    secret: SECRET // secret for signed tokens
  },
  csrfTokenSecret: SECRET,
  oauth2: {     // oauth2-server settings
    alwaysIssueNewRefreshToken: false, // each refresh_token grant does not write new refresh_token
    allowEmptyState: true
  },
  login: {
    clientId: 'login',
    clientSecret: 'loginsecret'
  }
}
Object.assign(config.database, mysql)
// Object.assign(config.database, mongo)

module.exports = config
