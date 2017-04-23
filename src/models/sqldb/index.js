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
    OAuthAccessTokens: sequelize.import('./OAuthAccessTokens'),
    OAuthAuthorizationCodes: sequelize.import('./OAuthAuthorizationCodes'),
    OAuthClients: sequelize.import('./OAuthClients'),
    OAuthRefreshTokens: sequelize.import('./OAuthRefreshTokens'),
    OAuthScopes: sequelize.import('./OAuthScopes'),
    Users: sequelize.import('./Users')
  }

  Object.keys(db).forEach(function (modelName) {
    if ('associate' in db[modelName]) {
      db[modelName].associate(db)
    }
  })

  const model = require('./model')(db)
  return {db, model}
}
