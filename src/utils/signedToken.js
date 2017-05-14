const crypto = require('crypto')
const promisify = require('./promisify')
const {encode, decode} = require('url-safe-base64')
const COMMON_LEN = 24

const randomBytes = promisify(crypto.randomBytes)
const trim = (str) => str.replace(/[=]+$/, '')

/**
* @private
* @param {String} secret
* @param {String} token
*/
const _generateSignedToken = (secret, token) => (
  randomBytes(COMMON_LEN)
  .then((buffer) => {
    const common = (token || buffer.toString('base64') || '').substr(0, COMMON_LEN)
    const hash = trim(crypto
      .createHmac('sha256', secret)
      .update(common)
      .digest('base64'))
    let join = common + hash
    return encode(join)
  })
)

const signedToken = (secret) => {
  if (!secret) throw new TypeError('signedToken needs secret')
  const generate = (token) => (
    _generateSignedToken(secret)
  )

  const validate = (token) => (
    _generateSignedToken(secret, decode(token || ''))
    .then((compare) => (compare === token ? token : null))
  )
  return {generate, validate}
}

module.exports = signedToken
