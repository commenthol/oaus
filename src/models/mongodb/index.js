const mongoose = require('mongoose')
const log = require('debug-level').log('oaus:models:mongodb')

mongoose.Promise = global.Promise

/**
* Connect to mongo database
* @param {Object} config - configuration
* @param {String} url - mongodb url
* @param {Object} passwordHash - password hash fn
* @param {Promise} passwordHash.compare - password hash compare fn
* @param {Object} signedTokenFn - signed token functions
* @param {Function} signedTokenFn.hmac - returns token <String>
* @param {Promise} signedTokenFn.verify - verifies a token
* @param {Promise} signedTokenFn.create - creates a token
* @return {Object} db object
*/
exports.connect = function connect ({ url, passwordHash, signedTokenFn, ...config }) {
  mongoose.connect(url, config, (err) => {
    if (err) {
      log.error({
        error: err.message,
        stack: err.stack
      })
      if (!/Trying to open unclosed connection/.test(err.message)) {
        throw err
      }
      return
    }
    log.debug('connected')
  })
    .catch(() => {})

  var db = {
    OAuthAccessTokens: require('./OAuthAccessTokens'),
    OAuthAuthorizationCodes: require('./OAuthAuthorizationCodes'),
    OAuthClients: require('./OAuthClients'),
    OAuthRefreshTokens: require('./OAuthRefreshTokens'),
    OAuthScopes: require('./OAuthScopes'),
    OAuthUsers: require('./OAuthUsers')
  }

  const model = require('./model')({ db, passwordHash, signedTokenFn })
  return {db, model}
}
