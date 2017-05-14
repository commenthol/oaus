/**
* model overwrites using stored procedures (mysql)
*/

const bcrypt = require('bcrypt')
const _get = require('lodash.get')
const {signedToken, toArray} = require('../../utils')
const {callBuilder, toJSON} = require('./storedProc')

const debug = require('debug')('oaus__model-proc')
debug.error = require('debug')('oaus__model-proc::error').bind(undefined, '%j')

module.exports = function (db, secret) {
  /** wrapper for stored procedure call */
  function storedQuery (...args) {
    return db.sequelize.query(callBuilder(...args))
  }

  const signedTokenFn = signedToken(secret)

  /* === === */

  function getAccessToken (bearerToken) {
    return signedTokenFn.validate(bearerToken)
    .then((bearerToken) => {
      if (!bearerToken) return null
      return storedQuery('oauth_access_tokens__read', bearerToken)
    })
    .then((tokens) => {
      if (!tokens && !tokens.length) return null
      const token = toJSON(tokens[0])
      debug('accessToken', token)
      return token
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getAccessToken'}, err))
    })
  }

  function getRefreshToken (refreshToken) {
    if (!refreshToken || refreshToken === 'undefined') return null

    return signedTokenFn.validate(refreshToken)
    .then((refreshToken) => {
      if (!refreshToken) return null
      return storedQuery('oauth_refresh_tokens__read', refreshToken)
    })
    .then((tokens) => {
      if (!tokens && !tokens.length) return null
      const token = toJSON(tokens[0])
      debug('refreshToken', token)
      return token
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getRefreshToken'}, err))
    })
  }

  function getAuthorizationCode (code) {
    return signedTokenFn.validate(code)
    .then((code) => {
      if (!code) return null
      return storedQuery('oauth_authorization_codes__read', code)
    })
    .then((codes) => {
      if (!codes && !codes.length) return null
      const code = toJSON(codes[0])
      debug('authorizationCode', code)
      return code
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getAuthorizationCode'}, err))
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
    })
  }

  function getUser (username, password) {
    return storedQuery('oauth_users__read', username)
    .then((users) => {
      if (!users || !users.length) return null
      const user = toJSON(users[0])
      debug('getUser', user)
      return bcrypt.compare(password, user.password)
      .then((isValid) => (isValid ? user : null))
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getUser', username}, err))
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
      debug.error(Object.assign({
        fn: 'getUserFromClient',
        clientId: client.clientId
      }, err))
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
      return Object.assign({
        client: client,
        user: user
      }, token)
    })
    .catch((err) => {
      debug.error(Object.assign({
        fn: 'saveToken',
        clientId: client.clientId
      }, err))
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
    })
    .catch((err) => {
      debug.error(Object.assign({
        fn: 'saveAuthorizationCode',
        clientId: client.clientId,
        username: user.username
      }, err))
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
