const Tokens = require('csrf')

/**
* Wrapper arround `csrf` module
*/
module.exports = function (secret) {
  const tokenFn = new Tokens()

  if (!secret) {
    throw new Error(`CSRF needs a secret! What about "${tokenFn.secretSync()}"`)
  }

  return {
    /**
    * use to obtain a new secret
    * NOTE: On cluster you need to set the secret the same on all servers
    */
    secret: () => {
      return tokenFn.secretSync()
    },

    /**
    * Creates a new token
    * @return {String}
    */
    create: () => {
      return tokenFn.create(secret)
    },

    /**
    * verifies token
    * @param {String}
    * @return {Boolean} `true` if valid token
    */
    verify: (token) => {
      return tokenFn.verify(secret, token)
    }
  }
}
