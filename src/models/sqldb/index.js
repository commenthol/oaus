const Sequelize = require('sequelize')
const _merge = require('lodash.merge')

/**
* Connect to SQL database
* @param {Object} config - @see http://sequelize.readthedocs.io/en/latest/api/sequelize/
*    or https://github.com/sequelize/sequelize/blob/master/docs/usage.md
* @param {Boolean} [config.storedProcedures=false] - set to `true` to enable stored procedures; requires import of `sql/procedures.sql`
* @return {Object} db object
*/
exports.connect = function connect (config) {
  const _config = _merge(
    {
      define: {
        charset: 'utf8',
        dialectOptions: {
          collate: 'utf8_unicode_ci'
        }
      },
      syncOnAssociation: true,
      pool: {max: 5, idle: 30}
    },
    config
  )
  const storedProcedures = _config.storedProcedures
  delete _config.storedProcedures

  const sequelize = new Sequelize(
    _config.url,
    _config
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

  OAuthClients.hasMany(OAuthClientsRedirects, {foreignKey: 'oauthClientId', limit: 5})
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
  if (storedProcedures) {
    require('./model-procedures')(db, model)
  }

  return {db, model}
}
