const {debug, toArray} = require('../../utils')
const _get = require('lodash.get')
const {callBuilder, toJSON, throwOnDbErr} = require('./storedProc')

/**
* @param {Object} db - database instance
*/
module.exports = function (db) {
  const {
    OAuthAuthorizationCodes,
    OAuthRefreshTokens,
    OAuthAccessTokens
  } = db

  /** wrapper for stored procedure call */
  function storedQuery (...args) {
    return db.sequelize.query(callBuilder(...args))
  }

  /* === models required by oauth2-server === */

  function getAccessToken (bearerToken) {
    debug('getAccessToken', bearerToken)
    return storedQuery('getAccessToken', bearerToken)
    .then((accessTokens) => {
      if (!accessTokens && !accessTokens.length) return null
      const accessToken = toJSON(accessTokens[0])
      debug('accessToken %j', accessToken)
      return accessToken
    })
    .catch((err) => {
      debug.error('getAccessToken %j', err)
      throwOnDbErr(err)
    })
  }

  function getClient (clientId, clientSecret) {
    debug('getClient %s %s', clientId, clientSecret)
    return storedQuery('getClient', clientId, clientSecret)
    .then((clients) => {
      if (!clients || !clients.length) return null
      // merge redirectUris
      const client = clients[0]
      // unique array from client(s).redirectUri
      client.redirectUris = Array.from(new Set(clients.map((client) => client.redirectUri)))
      delete client.redirectUri
      // grants are a comma seperated list of grants here
      client.grants = toArray(client.grants)
      debug('getClient %j', client)
      return client
    }).catch((err) => {
      debug.error('getClient %j', err)
      throwOnDbErr(err)
    })
  }

  function getUser (username, password) {
    return storedQuery('getUser', username)
    .then((users) => {
      if (!users || !users.length) return null
      const user = users[0]
      debug('user %j', user)
      return user.password === password ? user : null
    })
    .catch((err) => {
      debug.error('getUser %j', err)
      throwOnDbErr(err)
    })
  }

  function revokeAuthorizationCode (code) {
    debug('revokeAuthorizationCode', code)
    return OAuthAuthorizationCodes.findOne({
      where: {
        authorizationCode: code.code
      }
    }).then((authCode) => {
      if (authCode) authCode.destroy()
      return null
    }).catch((err) => {
      debug.error('revokeAuthorizationCode %j', err)
      throwOnDbErr(err)
    })
  }

  function revokeToken (token) {
    debug('revokeToken %j', token)
    return OAuthRefreshTokens.findOne({
      where: {
        refreshToken: token.refreshToken
      }
    }).then((refreshToken) => {
      if (refreshToken) refreshToken.destroy()
      return null
    }).catch((err) => {
      debug.error('revokeToken %j', err)
      throwOnDbErr(err)
    })
  }

  function saveToken (token, client, user) {
    debug('saveToken %j %j %j', token, client, user)
    return Promise.all([
      storedQuery('saveAccessToken', token.accessToken, token.accessTokenExpiresAt, token.scope, client.id, user.id),
      token.refreshToken
        ? storedQuery('saveRefreshToken', token.refreshToken, token.refreshTokenExpiresAt, token.scope, client.id, user.id)
        : []
    ])
    .then(() => {
      // expected to return client and user, but not returning
      return Object.assign({
        client: client,
        user: user
      }, token)
    })
    .catch((err) => {
      debug.error('saveToken %j', err)
      throwOnDbErr(err)
    })
  }

  function getAuthorizationCode (code) {
    debug('getAuthorizationCode %s', code)
    return storedQuery('getAuthorizationCode', code)
    .then((authCodes) => {
      if (!authCodes && !authCodes.length) return null
      const authCode = toJSON(authCodes[0])
      debug('getAuthorizationCode %j', authCode)
      return authCode
    }).catch((err) => {
      debug.error('getAuthorizationCode %j', err)
      throwOnDbErr(err)
    })
  }

  function saveAuthorizationCode (code, client, user) {
    debug('saveAuthorizationCode %s %j %j', code, client, user)
    return storedQuery('saveAuthorizationCode',
      code.authorizationCode, code.expiresAt, code.redirectUri, code.scope,
      client.id, user.id
    )
    .then(() => {
      code.code = code.authorizationCode
      return code
    }).catch((err) => {
      debug.error('saveAuthorizationCode %j', err)
      throwOnDbErr(err)
    })
  }

  function getUserFromClient (client) {
    debug('getUserFromClient %j', client)
    return storedQuery('getUserFromClient', client.clientId, client.clientSecret)
    .then((clients) => {
      if (!clients || !clients.length) return null
      const client = toJSON(clients[0])
      debug(client)
      return client
    }).catch((err) => {
      debug.error('getUserFromClient %j', err)
      throwOnDbErr(err)
    })
  }

  function getRefreshToken (refreshToken) {
    debug('getRefreshToken %s', refreshToken)
    if (!refreshToken || refreshToken === 'undefined') return null

    return storedQuery('getRefreshToken', refreshToken)
    .then((refreshTokens) => {
      if (!refreshTokens && !refreshTokens.length) return null
      const refreshToken = toJSON(refreshTokens[0])
      debug('refreshToken %j', refreshToken)
      return refreshToken
    })
    .catch((err) => {
      debug.error('getRefreshToken %j', err)
      throwOnDbErr(err)
    })
  }

  /*
  function validateScope (token, scope) {   // TODO implement
    debug('validateScope', token, scope)
    return (User.scope === scope && OAuthClients.scope === scope && scope !== null) ? scope : false
  }

  function verifyScope (token, scope) {
    return token.scope === scope
  }
  */

  /** === non oauth2-server methods === */

  /**
  * destroy all tokens assigned to a user (his bearerToken) e.g. on logout from the server
  * @param {String} bearerToken
  */
  function revokeAllTokens (bearerToken) {
    debug('revokeAllTokens bearerToken %s', bearerToken)
    return getAccessToken(bearerToken) // find user by bearerToken
    .then((accessToken) => {
      const userId = _get(accessToken, 'user.id')
      if (!accessToken || !userId) {
        throw new Error('no accessToken or userId found')
      }
      debug('revokeAllTokens accessToken found %j', accessToken)
      return Promise.all([
        OAuthAuthorizationCodes.destroy({
          where: {userId: userId}
        }),
        OAuthRefreshTokens.destroy({
          where: {userId: userId}
        }),
        OAuthAccessTokens.destroy({
          where: {userId: userId}
        })
      ])
    })
    .catch((err) => {
      debug.error('revokeAllTokens %j', err)
      throwOnDbErr(err)
    })
  }

  return {
    getAccessToken,
    getAuthorizationCode,
    getClient,
    getRefreshToken,
    getUser,
    getUserFromClient,
    revokeAuthorizationCode,
    revokeToken,
    saveToken,
    saveAuthorizationCode,
    // validateScope,
    // verifyScope,
    revokeAllTokens
  }
}
