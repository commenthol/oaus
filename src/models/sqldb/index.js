const Sequelize = require('sequelize')

/**
* Connect to SQL database
* @param {Object} config - @see http://sequelize.readthedocs.io/en/latest/api/sequelize/
* @return {Object} db object
*/
exports.connect = function connect (config) {
  const sequelize = new Sequelize(
    config.url,
    config
  )

  const db = {
    sequelize,
    OAuthAccessTokens: sequelize.import('./oauth_access_tokens'),
    OAuthAuthorizationCodes: sequelize.import('./oauth_authorization_codes'),
    OAuthClients: sequelize.import('./oauth_clients'),
    OAuthRefreshTokens: sequelize.import('./oauth_refresh_tokens'),
    OAuthScopes: sequelize.import('./oauth_scopes'),
    Users: sequelize.import('./users')
  }

  const model = require('./model')(db)
  return {db, model}
}
