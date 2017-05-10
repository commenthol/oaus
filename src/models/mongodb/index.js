const mongoose = require('mongoose')
const {debug} = require('../../utils')

mongoose.Promise = global.Promise

/**
* Connect to mongo database
* @param {Object} config - configuration
* @param {String} config.url - mongodb url
* @return {Object} db object
*/
exports.connect = function connect (config) {
  mongoose.connect(config.url, config, function (err) {
    if (err) {
      debug.error(err)
      return
    }
    debug('mongoose connected')
  })

  var db = {
    OAuthAccessTokens: require('./OAuthAccessTokens'),
    OAuthAuthorizationCodes: require('./OAuthAuthorizationCodes'),
    OAuthClients: require('./OAuthClients'),
    OAuthRefreshTokens: require('./OAuthRefreshTokens'),
    OAuthScopes: require('./OAuthScopes'),
    OAuthUsers: require('./OAuthUsers')
  }

  const model = require('./model')(db)
  return {db, model}
}
