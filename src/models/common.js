const crypto = require('crypto')
const _get = require('lodash.get')
const {promisify} = require('../utils')
const {encode, decode} = require('url-safe-base64')
const COMMON_LEN = 24

const randomBytes = promisify(crypto.randomBytes)
const trim = (str) => str.replace(/[=]+$/, '')

const _generateSignedToken = (secret, token) => (
  randomBytes(COMMON_LEN)
  .then((buffer) => {
    const common = (token || buffer.toString('base64')).substr(0, COMMON_LEN)
    const hash = trim(crypto
      .createHash('sha256')
      .update(common + secret)
      .digest('base64'))
    let join = common + hash
    return encode(join)
  })
)

const _clientId = (client) => _get(client, 'clientId', 'clientId')
const _userName = (user) => _get(user, 'username', 'username')
const _secret = (secret, client, user) => `${secret}-${_clientId(client)}-${_userName(user)}`

const generateSignedToken = (secret) =>
  (client, user, scope) => {
    const sec = _secret(secret, client, user)
    return _generateSignedToken(sec)
  }

const validateSignedToken = (secret) =>
  (token, client, user, scope) => {
    const sec = _secret(secret, client, user)
    return _generateSignedToken(sec, decode(token))
    .then((comp) => {
      return comp === token
    })
  }

module.exports = {
  generateSignedToken,
  validateSignedToken
}

exports.grantTypes = ['authorization_code', 'password', 'refresh_token', 'client_credentials']
