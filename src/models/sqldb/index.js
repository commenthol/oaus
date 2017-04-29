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

  // table definitions
  const OAuthAccessTokens = sequelize.import('./oauth_access_tokens')
  const OAuthAuthorizationCodes = sequelize.import('./oauth_authorization_codes')
  const OAuthClients = sequelize.import('./oauth_clients')
  const OAuthClientsRedirects = sequelize.import('./oauth_clients_redirects')
  const OAuthRefreshTokens = sequelize.import('./oauth_refresh_tokens')
  const OAuthScopes = sequelize.import('./oauth_scopes')
  const OAuthUsers = sequelize.import('./oauth_users')

  // table associations
  OAuthAccessTokens.belongsTo(OAuthClients, {foreignKey: 'oauthClientId'})
  OAuthAccessTokens.belongsTo(OAuthUsers, {foreignKey: 'userId'})

  OAuthAuthorizationCodes.belongsTo(OAuthClients, {foreignKey: 'oauthClientId'})
  OAuthAuthorizationCodes.belongsTo(OAuthUsers, {foreignKey: 'userId'})

  OAuthClients.belongsTo(OAuthUsers, {foreignKey: 'userId'})

  OAuthClients.hasMany(OAuthClientsRedirects, {foreignKey: 'oauthClientId'})
  OAuthClientsRedirects.belongsTo(OAuthClients, {foreignKey: 'oauthClientId'})

  OAuthRefreshTokens.belongsTo(OAuthClients, {foreignKey: 'oauthClientId'})
  OAuthRefreshTokens.belongsTo(OAuthUsers, {foreignKey: 'userId'})

  // struct
  const db = {
    sequelize,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthClients,
    OAuthClientsRedirects,
    OAuthRefreshTokens,
    OAuthScopes,
    OAuthUsers
  }

  const model = require('./model')(db)

  return {db, model}
}
