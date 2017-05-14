/**
* model for SQL based databases
*/

const bcrypt = require('bcrypt')
const _get = require('lodash.get')
const {signedToken, toArray} = require('../../utils')

const debug = require('debug')('oaus__model')
debug.error = require('debug')('oaus__model::error').bind(undefined, '%j')

/**
* @param {Object} db - database instance
*/
module.exports = function (db, secret) {
  const {
    OAuthUsers,
    OAuthClients,
    OAuthClientsRedirects,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthRefreshTokens
  } = db

  const signedTokenFn = signedToken(secret)

  /* === === */

  function generateAccessToken (client, user, scope) {
    return signedTokenFn.generate({client: client, user: user, scope: scope})
  }

  function generateRefreshToken (client, user, scope) {
    return signedTokenFn.generate({client: client, user: user, scope: scope})
  }

  function generateAuthorizationCode () {
    return signedTokenFn.generate()
  }

  /* === models required by oauth2-server === */

  function getAccessToken (bearerToken) {
    return signedTokenFn.validate(bearerToken)
    .then((bearerToken) => {
      if (!bearerToken) return null
      return OAuthAccessTokens
      .findOne({
        where: {accessToken: bearerToken},
        attributes: ['id', 'accessToken', ['expiresAt', 'accessTokenExpiresAt'], 'scope'],
        include: [{
          model: OAuthUsers,
          attributes: ['id', 'username', 'scope']
        }, {
          model: OAuthClients,
          attributes: ['id', 'clientId', 'scope']
        }]
      })
    })
    .then((accessToken) => {
      if (!accessToken) return null
      const token = accessToken.toJSON()
      assignClientUser(token)
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
      return OAuthRefreshTokens
      .findOne({
        where: {refreshToken: refreshToken},
        attributes: ['id', 'refreshToken', ['expiresAt', 'refreshTokenExpiresAt'], 'scope'],
        include: [{
          model: OAuthUsers,
          attributes: ['id', 'username', 'scope']
        }, {
          model: OAuthClients,
          attributes: ['id', 'clientId', 'scope']
        }]
      })
    })
    .then((refreshToken) => {
      if (!refreshToken) return null
      const token = refreshToken.toJSON()
      assignClientUser(token)
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
      return OAuthAuthorizationCodes
      .findOne({
        attributes: ['id', 'authorizationCode', 'expiresAt', 'redirectUri', 'scope'],
        where: {authorizationCode: code},
        include: [{
          model: OAuthUsers,
          attributes: ['id', 'username', 'scope']
        }, {
          model: OAuthClients,
          attributes: ['id', 'clientId', 'scope']
        }]
      })
    })
    .then((authCode) => {
      if (!authCode) return null
      const code = authCode.toJSON()
      assignClientUser(code)
      debug('authorizationCode', code)
      return code
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getAuthorizationCode'}, err))
    })
  }

  function getClient (clientId, clientSecret) {
    const options = {
      where: {clientId: clientId},
      include: [{
        model: OAuthClientsRedirects,
        attributes: ['redirectUri']
      }]
    }
    if (clientSecret) options.where.clientSecret = clientSecret

    return OAuthClients
    .findOne(options)
    .then((pClient) => {
      if (!pClient) return null
      // merge redirectUris
      const client = pClient.toJSON()
      // unique array from client(s).redirectUri
      client.redirectUris = Array.from(new Set(client.oauth_clients_redirects.map((client) => client.redirectUri)))
      delete client.oauth_clients_redirects
      // grants are a comma seperated list of grants here
      client.grants = toArray(client.grants)
      debug('getClient', client)
      return client
    }).catch((err) => {
      debug.error(Object.assign({fn: 'getClient', clientId}, err))
    })
  }

  function getUser (username, password) {
    return OAuthUsers
    .findOne({
      where: {username: username},
      attributes: ['id', 'username', 'password', 'scope']
    })
    .then((user) => {
      if (!user) return null
      user = user.toJSON()
      debug('getUser', user)
      return bcrypt.compare(password, user.password)
      .then((isValid) => (isValid ? user : null))
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'getUser', username}, err))
    })
  }

  function getUserFromClient (client) {
    const options = {
      where: {clientId: client.clientId},
      attributes: ['id', 'clientId'],
      include: [{
        model: OAuthUsers,
        attributes: ['id', 'username', 'scope', 'createdAt', 'updatedAt']
      }]
    }
    if (client.clientSecret) options.where.clientSecret = client.clientSecret

    return OAuthClients
    .findOne(options)
    .then((data) => {
      if (!data || !data.oauth_user) return null
      const user = data.oauth_user.toJSON()
      debug('getUserFromClient', user)
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
        oauthClientId: client.id,
        userId: user.id,
        scope: token.scope
      }),
      token.refreshToken
        ? OAuthRefreshTokens.create({ // no refresh token for client_credentials
          refreshToken: token.refreshToken,
          expiresAt: token.refreshTokenExpiresAt,
          oauthClientId: client.id,
          userId: user.id,
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
      oauthClientId: client.id,
      userId: user.id,
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
    return OAuthAuthorizationCodes.findOne({
      where: {
        authorizationCode: code.code
      }
    }).then((authCode) => {
      if (authCode) authCode.destroy()
      // expire the code
      code.expiresAt = new Date(0)
      return code
    }).catch((err) => {
      debug.error(Object.assign({fn: 'revokeAuthorizationCode'}, err))
    })
  }

  function revokeToken (token) {
    debug('revokeToken', token)
    return OAuthRefreshTokens.findOne({
      where: {
        refreshToken: token.refreshToken
      }
    }).then((refreshToken) => {
      if (refreshToken) refreshToken.destroy()
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
      const userId = _get(accessToken, 'user.id')
      if (!accessToken || !userId) {
        throw new Error('no accessToken or userId found')
      }
      debug('revokeAllTokens accessToken found %j', accessToken)
      return Promise.all([
        OAuthAuthorizationCodes.destroy({where: {userId: userId}}),
        OAuthRefreshTokens.destroy({where: {userId: userId}}),
        OAuthAccessTokens.destroy({where: {userId: userId}}),
        lastSignOutAt({id: userId})
      ])
    })
    .catch((err) => {
      debug.error(Object.assign({fn: 'revokeAllTokens'}, err))
    })
  }

  function lastSignInAt (user) {
    if (!user || !user.id) return
    return OAuthUsers.update(
      {lastSignInAt: new Date()},
      {where: {id: user.id}}
    )
  }

  function lastSignOutAt (user) {
    return OAuthUsers.update(
      {lastSignOutAt: new Date()},
      {where: {id: user.id}}
    )
  }

  // exports
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
  if (data.oauth_user) {
    data.user = data.oauth_user
    delete data.oauth_user
  }
  if (data.oauth_client) {
    data.client = data.oauth_client
    delete data.oauth_client
  }
}
