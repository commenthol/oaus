/**
* model for SQL based databases
*/

const {Op} = require('sequelize')
const _get = require('lodash.get')
const {toArray} = require('../../utils')
const log = require('debug-level').log('oaus:models:sqldb')

/**
* @param {Object} db - database instance
* @param {Object} passwordHash - password hash fn
* @param {Promise} passwordHash.compare - password hash compare fn
*/
module.exports = function ({ db, passwordHash, signedTokenFn }) {
  const {
    OAuthUsers,
    OAuthClients,
    OAuthClientsRedirects,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthRefreshTokens
  } = db

  /* === === */

  function generateAccessToken (client, user, scope) {
    return signedTokenFn.create({client, user, scope})
  }

  function generateRefreshToken (client, user, scope) {
    return signedTokenFn.create({client, user, scope})
  }

  function generateAuthorizationCode () {
    return signedTokenFn.create()
  }

  /* === models required by oauth2-server === */

  function getAccessToken (bearerToken) {
    return signedTokenFn.verify(bearerToken)
      .then((bearerToken) => {
        if (!bearerToken) return null
        return OAuthAccessTokens
          .findOne({
            where: {accessToken: signedTokenFn.hmac(bearerToken)},
            attributes: ['id', 'accessToken', ['expiresAt', 'accessTokenExpiresAt'], 'scope'],
            include: [{
              model: OAuthUsers,
              attributes: ['id', 'username', 'scope', 'logoutToken']
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
        log.debug('accessToken', token)
        return token
      })
      .catch((err) => {
        log.error(Object.assign({fn: 'getAccessToken'}, err))
      })
  }

  function getRefreshToken (refreshToken) {
    if (!refreshToken || refreshToken === 'undefined') return null

    return signedTokenFn.verify(refreshToken)
      .then((refreshToken) => {
        if (!refreshToken) return null
        return OAuthRefreshTokens
          .findOne({
            where: {refreshToken: signedTokenFn.hmac(refreshToken)},
            attributes: ['id', 'refreshToken', ['expiresAt', 'refreshTokenExpiresAt'], 'scope'],
            include: [{
              model: OAuthUsers,
              attributes: ['id', 'username', 'scope', 'remember', 'logoutToken']
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
        log.debug('refreshToken', token)
        return token
      })
      .catch((err) => {
        log.error(Object.assign({fn: 'getRefreshToken'}, err))
      })
  }

  function getAuthorizationCode (code) {
    return signedTokenFn.verify(code)
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
        log.debug('authorizationCode', code)
        return code
      })
      .catch((err) => {
        log.error(Object.assign({fn: 'getAuthorizationCode'}, err))
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

    return OAuthClients
      .findOne(options)
      .then((pClient) => {
        if (!pClient) return null
        // merge redirectUris
        const client = pClient.toJSON()
        // unique array from client(s).redirectUri
        client.redirectUris = Array.from(new Set(client.oauth_clients_redirects.map((client) => client.redirectUri)))
        delete client.oauth_clients_redirects
        client.grants = toArray(client.grants)
        log.debug('getClient', client)
        if (!clientSecret) return client
        return passwordHash.compare(clientSecret || '', client.secret || '')
          .then((isValid) => (isValid ? client : null))
      }).catch((err) => {
        log.error(Object.assign({fn: 'getClient', clientId}, err))
      })
  }

  function getUser (username, password) {
    return OAuthUsers
      .findOne({
        where: {username: username},
        attributes: [
          'id', 'username', 'password', 'scope', 'remember',
          'logoutToken', 'lastSignInAt', 'lastSignOutAt'
        ]
      })
      .then((user) => {
        if (!user) return null
        user = user.toJSON()
        log.debug('getUser', user)
        return passwordHash.compare(password, user.password)
          .then((isValid) => (isValid ? user : null))
      })
      .catch((err) => {
        log.error(Object.assign({fn: 'getUser', username}, err))
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

    return OAuthClients
      .findOne(options)
      .then((data) => {
        if (!data || !data.oauth_user) return null
        const user = data.oauth_user.toJSON()
        log.debug('getUserFromClient', user)
        return user
      })
      .catch((err) => {
        log.error(Object.assign({
          fn: 'getUserFromClient',
          clientId: client.clientId
        }, err))
      })
  }

  function saveToken (token, client, user) {
    log.debug('saveToken', token, client, user)
    return Promise.all([
      OAuthAccessTokens.create({
        accessToken: signedTokenFn.hmac(token.accessToken),
        expiresAt: token.accessTokenExpiresAt,
        oauthClientId: client.id,
        userId: user.id,
        scope: token.scope
      }),
      token.refreshToken // there is no refresh token for grant client_credentials
        ? OAuthRefreshTokens.create({
          refreshToken: signedTokenFn.hmac(token.refreshToken),
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
        log.error(Object.assign({
          fn: 'saveToken',
          clientId: client.clientId
        }, err))
      })
  }

  function saveAuthorizationCode (code, client, user) {
    log.debug('saveAuthorizationCode', code, client, user)
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
        log.error(Object.assign({
          fn: 'saveAuthorizationCode',
          clientId: client.clientId,
          username: user.username
        }, err))
      })
  }

  function revokeAuthorizationCode (code) {
    log.debug('revokeAuthorizationCode', code)
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
      log.error(Object.assign({fn: 'revokeAuthorizationCode'}, err))
    })
  }

  function revokeToken (token) {
    log.debug('revokeToken', token)
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
      log.error(Object.assign({fn: 'revokeToken'}, err))
    })
  }

  function validateScope (user, client, scope) { // TODO
    // console.log('###validateScope', user, client, scope)
    return 'undefined' // TODO add validation
  }

  function verifyScope (token, scope) { // TODO
    // console.log('###verifyScope', token, scope)
    return true // TODO add verification
  }

  /** === non oauth2-server methods === */

  /**
  * destroy all tokens assigned to a user e.g. on logout from the server
  * @param {String} accessToken
  * @param {String} [refreshToken]
  * @return {Promise} `{user, result}`
  */
  function revokeAllTokens (accessToken, refreshToken) {
    let promise
    if (refreshToken) {
      promise = getRefreshToken(refreshToken)
    } else {
      promise = getAccessToken(accessToken)
    }

    return promise
      .then((token) => {
        const {user} = token || {}
        const userId = _get(user, 'id')
        if (!userId) {
          throw new Error('no token or userId found')
        }
        log.debug('revokeAllTokens', token)
        return Promise.all([
          OAuthAuthorizationCodes.destroy({where: {userId: userId}}),
          OAuthRefreshTokens.destroy({where: {userId: userId}}),
          OAuthAccessTokens.destroy({where: {userId: userId}}),
          lastSignOutAt({id: userId})
        ]).then((result) => {
          return {user, result}
        })
      })
      .catch((err) => {
        log.error(Object.assign({fn: 'revokeAllTokens'}, err))
        throw err
      })
  }

  function lastSignInAt (user, remember) {
    if (!user || !user.id) return
    return generateAuthorizationCode()
      .then((code) => {
        return OAuthUsers.update(
          {
            lastSignInAt: new Date(),
            logoutToken: code.substr(0, 32),
            remember: !!remember
          },
          {where: {id: user.id}}
        )
      })
  }

  function lastSignOutAt (user) {
    return OAuthUsers.update(
      {lastSignOutAt: new Date()},
      {where: {id: user.id}}
    )
  }

  /*
  select distinct(oauthClientId), `oauth_clients`.`clientId`
  from oauth_access_tokens AS oauth_access_tokens
  LEFT OUTER JOIN `oauth_clients`
  ON `oauthClientId` = `oauth_clients`.`id`
  where oauth_access_tokens.userId = 2;
  */
  function logoutClients (user = {}) {
    return OAuthAccessTokens
      .findAll({
        attributes: ['oauthClientId'],
        where: {userId: user.id},
        raw: true
      })
      .then((data) => {
        let vals = (data || []).map((row) => row.oauthClientId)
        let clients = Array.from(new Set(vals))
        return OAuthClients.findAll({
          attributes: ['clientId', 'logoutURI'],
          where: { id: {[Op.or]: clients} },
          raw: true
        })
      })
      .then((clients) => {
        clients = clients.filter((client) => client.logoutURI)
        return {user, clients: clients}
      })
  }

  // exports
  return {
    db,
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
    lastSignInAt,
    logoutClients
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
