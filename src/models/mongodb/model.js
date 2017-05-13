const bcrypt = require('bcrypt')
const _get = require('lodash.get')
const {generateSignedToken} = require('../common')
const {httpError} = require('../../utils')

const debug = require('debug')('oauth2__model')
debug.error = require('debug')('oauth2__model::error').bind(undefined, '%j')

/**
* @param {Object} db - database instance
*/
module.exports = function (db, secret) {
  const {
    OAuthUsers,
    OAuthClients,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthRefreshTokens
  } = db

  const generateSignedTokenFn = generateSignedToken(secret)

  /* === === */

  function generateAccessToken (client, user, scope) {
    return generateSignedTokenFn(client, user, scope)
  }

  function generateRefreshToken (client, user, scope) {
    return generateSignedTokenFn(client, user, scope)
  }

  function generateAuthorizationCode () {
    return generateSignedTokenFn()
  }

  /* === models required by oauth2-server === */

  function getAccessToken (bearerToken) {
    return OAuthAccessTokens
    .findOne({accessToken: bearerToken})
    .populate('userId')
    .populate('oauthClientId')
    .then((token) => {
      debug('accessToken', token)
      if (!token) return null
      token = token.toJSON()
      assignClientUser(token)
      token.accessTokenExpiresAt = token.expiresAt
      delete token.expiresAt
      return token
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getAccessToken'}, err))
    })
  }

  function getRefreshToken (refreshToken) {
    if (!refreshToken || refreshToken === 'undefined') return false

    return OAuthRefreshTokens
    .findOne({refreshToken: refreshToken})
    .populate('userId')
    .populate('oauthClientId')
    .then((token) => {
      if (!token) return null
      token = token.toJSON()
      assignClientUser(token)
      token.refreshTokenExpiresAt = token.expiresAt
      delete token.expiresAt
      debug('refreshToken', token)
      return token
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getRefreshToken'}, err))
    })
  }

  function getAuthorizationCode (code) {
    return OAuthAuthorizationCodes
    .findOne({authorizationCode: code})
    .populate('userId')
    .populate('oauthClientId')
    .then((code) => {
      if (!code) return null
      code = code.toJSON()
      assignClientUser(code)
      debug('authorizationCode', code)
      return code
    }).catch((err) => {
      debug.error(Object.assign({fn: 'getAuthorizationCode'}, err))
    })
  }

  function getClient (clientId, clientSecret) {
    debug('getClient', clientId, clientSecret)
    const options = {clientId: clientId}
    if (clientSecret) options.clientSecret = clientSecret

    return OAuthClients
    .findOne(options)
    .then((client) => {
      if (!client) return null
      client = client.toJSON()
      client.redirectUris = Array.from(new Set(client.redirectUris))
      return client
    }).catch((err) => {
      debug.error(Object.assign({fn: 'getClient', clientId}, err))
    })
  }

  function getUser (username, password) {
    let _user = null
    return OAuthUsers
    .findOne({username: username})
    .then((user) => {
      debug('getUser', user)
      if (!user) return null
      _user = user
      return bcrypt.compare(password, user.password)
    })
    .then((bcryptRes) => {
      debug('getUser bcrypt', username, bcryptRes)
      if (bcryptRes) {
        const user = _user.toJSON()
        delete user.password
        return user
      }
      return null
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getUser', username}, err))
    })
  }

  function getUserFromClient (client) {
    debug('getUserFromClient', client)
    const options = {clientId: client.clientId}
    if (client.clientSecret) options.clientSecret = client.clientSecret

    return OAuthClients
    .findOne(options)
    .populate('userId')
    .then((client) => {
      if (!client || !client.userId) return null
      let user = client.userId.toJSON()
      debug('getUserFromClient', user)
      delete user.password
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
      OAuthAccessTokens.create({
        accessToken: token.accessToken,
        expiresAt: token.accessTokenExpiresAt,
        oauthClientId: client._id,
        userId: user._id,
        scope: token.scope
      }),
      token.refreshToken
        ? OAuthRefreshTokens.create({ // no refresh token for client_credentials
          refreshToken: token.refreshToken,
          expiresAt: token.refreshTokenExpiresAt,
          oauthClientId: client._id,
          userId: user._id,
          scope: token.scope
        })
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
    return OAuthAuthorizationCodes
    .create({
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      oauthClientId: client._id,
      userId: user._id,
      scope: code.scope
    })
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

  function revokeAuthorizationCode (code) {
    debug('revokeAuthorizationCode', code)
    return OAuthAuthorizationCodes.deleteOne({
      authorizationCode: code.code
    }).then((authCode) => {
      // if (authCode) authCode.destroy()
      // expire the code
      code.expiresAt = new Date(0)
      return code
    }).catch((err) => {
      debug.error(Object.assign({fn: 'revokeAuthorizationCode'}, err))
    })
  }

  function revokeToken (token) {
    debug('revokeToken', token)
    return OAuthRefreshTokens.deleteOne({
      refreshToken: token.refreshToken
    }).then((refreshToken) => {
      // if (refreshToken) refreshToken.destroy()
      // expire the token
      token.refreshTokenExpiresAt = new Date(0)
      return token
    }).catch((err) => {
      debug.error(Object.assign({fn: 'revokeToken'}, err))
    })
  }

  function validateScope (user, client, scope) {
    // console.log('###validateScope', user, client, scope)
    return 'undefined' // TODO add validation
  }

  function verifyScope (token, scope) {
    // console.log('###verifyScope', token, scope)
    return true // TODO add verification
  }

  /** === non oauth2-server methods === */

  /**
  * destroy all tokens assigned to a user (his bearerToken) e.g. on logout from the server
  * @param {String} bearerToken
  */
  function revokeAllTokens (bearerToken) {
    return getAccessToken(bearerToken) // find user by bearerToken
    .then((accessToken) => {
      const userId = _get(accessToken, 'user._id')
      if (!accessToken || !userId) {
        throw httpError(401, 'no accessToken or userId found')
      }
      debug('revokeAllTokens accessToken', accessToken)
      return Promise.all([
        OAuthAuthorizationCodes.remove({userId: userId}), // TODO mighht not work
        OAuthRefreshTokens.remove({userId: userId}),
        OAuthAccessTokens.remove({userId: userId}),
        lastSignOutAt({_id: userId})
      ])
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'revokeAllTokens'}, err))
    })
  }

  function lastSignInAt (user, next) {
    if (!user || !user._id) return
    return OAuthUsers.findOneAndUpdate(
      {_id: user._id},
      {lastSignInAt: new Date()},
      {upsert: true}
    )
  }

  function lastSignOutAt (user) {
    return OAuthUsers.findOneAndUpdate(
      {_id: user._id},
      {lastSignOutAt: new Date()},
      {upsert: true}
    )
  }

/*
  function findUser (username) {
    return OAuthUsers
    .findOne({username: username})
    .then((user) => {
      return user
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'findUser', username}, err)
    })
  }
  function upsertUser (user) {
    return OAuthUsers
    .findOneAndUpdate({username: user.username}, user, {upsert: true})
    .then((user) => user)
    .catch((err) => {
      debug.error('upsertUser %j', err)
    })
  }
  function deleteUser (username) {
    return OAuthUsers
    .findOneAndDelete({username: username})
    .then((user) => user)
    .catch((err) => {
      debug.error('deleteUser %j', err)
    })
  }

  function findClient (query) {
    return OAuthClients.findOne(query).then((client) => {
      console.log(1, client)
      return client
    })
  }
  function upsertClient (username, client) {
    debug('updateClient', username, client)

    return findUser(username)
    .then((user) => {
      client.User = user._id
      return OAuthClients
      .findOneAndUpdate({clientId: client.clientId}, client, {upsert: true})
      .then((client) => client)
      .catch((err) => {
        debug.error('updateClient %j', err)
      })
    })
  }
  function deleteClient (clientId) {
    return OAuthClients
    .findOneAndDelete({clientId: clientId})
    .then((client) => client)
    .catch((err) => {
      debug.error('deleteClient %j', err)
    })
  }
*/

  return {
    generateAccessToken,
    generateRefreshToken,
    generateAuthorizationCode,
    // ---
    getAccessToken,
    getAuthorizationCode,
    getClient,
    getRefreshToken,
    getUser,
    getUserFromClient,
    revokeAuthorizationCode,
    revokeToken,
    saveAuthorizationCode,
    saveToken,
    validateScope,
    verifyScope,
    // ----
    revokeAllTokens,
    lastSignInAt
  }
}

/**
* assign user and/or client after querying
* @private
*/
function assignClientUser (data) {
  if (!data) return
  if (data.userId) {
    data.user = data.userId
    delete data.userId
  }
  if (data.oauthClientId) {
    data.client = data.oauthClientId
    delete data.oauthClientId
  }
}
