// require('mysql2') // required by sequelize
const Sequelize = require('sequelize')
const _merge = require('lodash.merge')

/**
* Connect to SQL database
* @param {String} url - database url
* @param {Object} passwordHash - password hash fn
* @param {Promise} passwordHash.compare - password hash compare fn
* @param {Object} signedTokenFn - signed token functions
* @param {Function} signedTokenFn.hmac - returns token <String>
* @param {Promise} signedTokenFn.verify - verifies a token
* @param {Promise} signedTokenFn.create - creates a token
* @param {Object} config - @see http://sequelize.readthedocs.io/en/latest/api/sequelize/
*    or https://github.com/sequelize/sequelize/blob/master/docs/usage.md
* @return {Object} db object
*/
exports.connect = function connect ({ url, passwordHash, signedTokenFn, ...config }) {
  const _config = _merge(
    {
      define: {
        charset: 'utf8mb4',
        dialectOptions: {
          collate: 'utf8mb4_bin'
        }
      },
      syncOnAssociation: true,
      pool: {max: 5, idle: 30}
    },
    config
  )

  const sequelize = new Sequelize(url, _config)

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

  const model = require('./model')({ db, passwordHash, signedTokenFn })

  return {db, model}
}
