/**
* model overwrites using stored procedures
*/

const bcrypt = require('bcrypt')
const _get = require('lodash.get')
const {toArray} = require('../../utils')
const {callBuilder, toJSON, throwOnDbErr} = require('./storedProc')

const debug = require('debug')('oauth2__model-proc')
debug.error = require('debug')('oauth2__model-proc::error').bind(undefined, '%j')

module.exports = function (db) {
  /** wrapper for stored procedure call */
  function storedQuery (...args) {
    return db.sequelize.query(callBuilder(...args))
  }

  function getAccessToken (bearerToken) {
    return storedQuery('oauth_access_tokens__read', bearerToken)
    .then((accessTokens) => {
      if (!accessTokens && !accessTokens.length) return null
      const accessToken = toJSON(accessTokens[0])
      debug('accessToken', accessToken)
      return accessToken
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getAccessToken'}, err))
      throwOnDbErr(err)
    })
  }

  function getRefreshToken (refreshToken) {
    if (!refreshToken || refreshToken === 'undefined') return null

    return storedQuery('oauth_refresh_tokens__read', refreshToken)
    .then((refreshTokens) => {
      if (!refreshTokens && !refreshTokens.length) return null
      const refreshToken = toJSON(refreshTokens[0])
      debug('refreshToken', refreshToken)
      return refreshToken
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getRefreshToken'}, err))
      throwOnDbErr(err)
    })
  }

  function getAuthorizationCode (code) {
    return storedQuery('oauth_authorization_codes__read', code)
    .then((authCodes) => {
      if (!authCodes && !authCodes.length) return null
      const authCode = toJSON(authCodes[0])
      debug('getAuthorizationCode', authCode)
      return authCode
    }).catch((err) => {
      debug.error(Object.assign({fn: 'getAuthorizationCode'}, err))
      throwOnDbErr(err)
    })
  }

  function getClient (clientId, clientSecret) {
    return storedQuery('oauth_clients__read', clientId, clientSecret)
    .then((data) => {
      if (!data || !data.length) return null
      // merge redirectUris
      const client = data[0]
      if (clientSecret && client.clientSecret !== clientSecret) return null
      // unique array from client(s).redirectUri
      client.redirectUris = Array.from(new Set(data.map((client) => client.redirectUri)))
      delete client.redirectUri
      // grants are a comma separated list of grants here
      client.grants = toArray(client.grants)
      debug('getClient', client)
      return client
    }).catch((err) => {
      debug.error(Object.assign({fn: 'getClient', clientId}, err))
      throwOnDbErr(err)
    })
  }

  function getUser (username, password) {
    let _user = null
    return storedQuery('oauth_users__read', username)
    .then((users) => {
      if (!users || !users.length) return null
      const user = users[0]
      debug('getUser', user)
      _user = user
      return bcrypt.compare(password, user.password)
    })
    .then((bcryptRes) => {
      debug('getUser bcrypt', username, bcryptRes)
      return bcryptRes ? _user : null
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getUser', username}, err))
      throwOnDbErr(err)
    })
  }

  function getUserFromClient (client) {
    return storedQuery('oauth_clients__users__read', client.clientId, client.clientSecret)
    .then((clients) => {
      if (!clients || !clients.length) return null
      const _client = toJSON(clients[0])
      if (client.clientSecret && _client.clientSecret !== client.clientSecret) return null
      const user = _get(_client, 'user')
      return user
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getUserFromClient',
        clientId: client.clientId
      }, err))
      throwOnDbErr(err)
    })
  }

  function saveToken (token, client, user) {
    debug('saveToken', token, client, user)
    return Promise.all([
      storedQuery('oauth_access_tokens__create', token.accessToken, token.accessTokenExpiresAt, token.scope, client.id, user.id),
      token.refreshToken
        ? storedQuery('oauth_refresh_tokens__create', token.refreshToken, token.refreshTokenExpiresAt, token.scope, client.id, user.id)
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
      debug.error(Object.assign({fn: 'saveToken',
        clientId: client.clientId
      }, err))
      throwOnDbErr(err)
    })
  }

  function saveAuthorizationCode (code, client, user) {
    debug('saveAuthorizationCode', code, client, user)
    return storedQuery('oauth_authorization_codes__create',
      code.authorizationCode, code.expiresAt, code.redirectUri, code.scope,
      client.id, user.id
    )
    .then(() => {
      code.code = code.authorizationCode
      return code
    }).catch((err) => {
      debug.error(Object.assign({fn: 'saveAuthorizationCode',
        clientId: client.clientId,
        username: user.username
      }, err))
      throwOnDbErr(err)
    })
  }

  // exports
  return {
    getAccessToken,
    getAuthorizationCode,
    getClient,
    getRefreshToken,
    getUser,
    getUserFromClient,
    saveAuthorizationCode,
    saveToken
  }
}
