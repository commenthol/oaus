const mongoose = require('mongoose')
const debug = require('debug')('oaus__model-mongo')
debug.error = require('debug')('oaus__model-mongo::error').bind(undefined, '%j')

mongoose.Promise = global.Promise

/**
* Connect to mongo database
* @param {Object} config - configuration
* @param {String} config.url - mongodb url
* @param {String} config.secret - secret for signed tokens
* @return {Object} db object
*/
exports.connect = function connect (config) {
  mongoose.connect(config.url, config, function (err) {
    if (err) {
      debug.error({
        error: err.message,
        stack: err.stack
      })
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

  const model = require('./model')(db, config.secret)
  return {db, model}
}
