const bcrypt = require('bcrypt')
const _get = require('lodash.get')
const {toArray} = require('../../utils')
const {throwOnDbErr} = require('./storedProc')

const debug = require('debug')('oauth2__model')
debug.error = require('debug')('oauth2::error')

/**
* @param {Object} db - database instance
*/
module.exports = function (db) {
  const {
    OAuthUsers,
    OAuthClients,
    OAuthClientsRedirects,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthRefreshTokens
  } = db

  /* === models required by oauth2-server === */

  function getAccessToken (bearerToken) {
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
    .then((pAccessToken) => {
      if (!pAccessToken) return null
      const token = pAccessToken.toJSON()
      assignClientUser(token)
      debug('accessToken %j', token)
      return token
    })
    .catch((err) => {
      debug.error('getAccessToken', err)
      throwOnDbErr(err)
    })
  }

  function getRefreshToken (refreshToken) {
    debug('getRefreshToken %s', refreshToken)
    if (!refreshToken || refreshToken === 'undefined') return null

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
    .then(function (pRefreshToken) {
      if (!pRefreshToken) return null
      const token = pRefreshToken.toJSON()
      assignClientUser(token)
      debug('refreshToken %j', token)
      return token
    })
    .catch((err) => {
      debug.error('getRefreshToken %j', err)
      throwOnDbErr(err)
    })
  }

  function getAuthorizationCode (code) {
    debug('getAuthorizationCode %s', code)
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
      .then((pAuthCode) => {
        if (!pAuthCode) return null
        const code = pAuthCode.toJSON()
        assignClientUser(code)
        debug('authorizationCode %j', code)
        return code
      }).catch((err) => {
        debug.error('getAuthorizationCode %j', err)
        throwOnDbErr(err)
      })
  }

  function getClient (clientId, clientSecret) {
    debug('getClient %s %s', clientId, clientSecret)
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
      delete client.clientSecret
      // unique array from client(s).redirectUri
      client.redirectUris = Array.from(new Set(client.oauth_clients_redirects.map((client) => client.redirectUri)))
      delete client.oauth_clients_redirects
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
    let _user = null
    return OAuthUsers
    .findOne({
      where: {username: username},
      attributes: ['id', 'username', 'password', 'scope']
    })
    .then((user) => {
      debug('getUser %j', user)
      if (!user) return null
      _user = user
      return bcrypt.compare(password, user.password)
    })
    .then((bcryptRes) => {
      debug('getUser bcrypt %s %s', username, bcryptRes)
      return bcryptRes ? _user.toJSON() : null
    })
    .catch((err) => {
      debug.error('getUser %j', err)
      throwOnDbErr(err)
    })
  }

  function getUserFromClient (client) {
    debug('getUserFromClient %j', client)
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
      debug('getUserFromClient %j', user)
      return user
    })
    .catch((err) => {
      debug.error('getUserFromClient %j', err)
      throwOnDbErr(err)
    })
  }

  function saveToken (token, client, user) {
    debug('saveToken %j %j %j', token, client, user)
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
      debug.error('saveToken %j', err)
      throwOnDbErr(err)
    })
  }

  function saveAuthorizationCode (code, client, user) {
    debug('saveAuthorizationCode %s %j %j', code, client, user)
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
      debug.error('saveAuthorizationCode %j', err)
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
      // expire the code
      code.expiresAt = new Date(0)
      return code
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
      // expire the token
      token.refreshTokenExpiresAt = new Date(0)
      return token
    }).catch((err) => {
      debug.error('revokeToken %j', err)
      throwOnDbErr(err)
    })
  }

  function validateScope (user, client, scope) {
    console.log('###validateScope', user, client, scope)
    return 'undefined' // TODO add validation
  }

  function verifyScope (token, scope) {
    console.log('###verifyScope', token, scope)
    return true // TODO add verification
  }

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

  // exports
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
    validateScope,
    verifyScope,
    revokeAllTokens
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
