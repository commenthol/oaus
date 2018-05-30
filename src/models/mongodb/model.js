/**
* model for mongodb
*/

const _get = require('lodash.get')
const log = require('debug-level').log('oaus:models:mongodb')

/**
* @param {Object} db - database instance
* @param {Object} passwordHash - password hash fn
* @param {Promise} passwordHash.compare - password hash compare fn
* @param {Object} signedTokenFn - signed token functions
* @param {Function} signedTokenFn.hmac - returns token <String>
* @param {Promise} signedTokenFn.verify - verifies a token
* @param {Promise} signedTokenFn.create - creates a token
*/
module.exports = function ({ db, passwordHash, signedTokenFn }) {
  const {
    OAuthUsers,
    OAuthClients,
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
          .findOne({accessToken: signedTokenFn.hmac(bearerToken)})
          .populate('userId')
          .populate('oauthClientId')
      })
      .then((accessToken) => {
        if (!accessToken) return null
        const token = accessToken.toJSON()
        assignClientUser(token)
        token.accessTokenExpiresAt = token.expiresAt
        delete token.expiresAt
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
          .findOne({refreshToken: signedTokenFn.hmac(refreshToken)})
          .populate('userId')
          .populate('oauthClientId')
      })
      .then((refreshToken) => {
        if (!refreshToken) return null
        const token = refreshToken.toJSON()
        assignClientUser(token)
        token.refreshTokenExpiresAt = token.expiresAt
        delete token.expiresAt
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
          .findOne({authorizationCode: code})
          .populate('userId')
          .populate('oauthClientId')
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
    const options = {clientId: clientId}

    return OAuthClients
      .findOne(options)
      .then((pClient) => {
        if (!pClient) return null
        const client = pClient.toJSON()
        client.redirectUris = Array.from(new Set(client.redirectUris)) // TODO need for set?
        if (!clientSecret) return client
        return passwordHash.compare(clientSecret || '', client.secret || '')
          .then((isValid) => (isValid ? client : null))
      }).catch((err) => {
        log.error(Object.assign({fn: 'getClient', clientId}, err))
      })
  }

  function getUser (username, password) {
    return OAuthUsers
      .findOne({username: username})
      .then((user) => {
        if (!user) return null
        user = user.toJSON()
        const userPassword = user.password
        delete user.password
        log.debug('getUser', user)
        return passwordHash.compare(password, userPassword)
          .then((isValid) => (isValid ? user : null))
      })
      .catch((err) => {
        log.error(Object.assign({fn: 'getUser', username}, err))
      })
  }

  function getUserFromClient (client) {
    const options = {clientId: client.clientId}

    return OAuthClients
      .findOne(options)
      .populate('userId')
      .then((client) => {
        if (!client || !client.userId) return null
        let user = client.userId.toJSON()
        log.debug('getUserFromClient', user)
        delete user.password
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
        oauthClientId: client._id,
        userId: user._id,
        scope: token.scope
      }),
      token.refreshToken // there is no refresh token for grant client_credentials
        ? OAuthRefreshTokens.create({
          refreshToken: signedTokenFn.hmac(token.refreshToken),
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
        oauthClientId: client._id,
        userId: user._id,
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
    return OAuthAuthorizationCodes.deleteOne({
      authorizationCode: code.code
    }).then(() => {
      // expire the code
      code.expiresAt = new Date(0)
      return code
    }).catch((err) => {
      log.error(Object.assign({fn: 'revokeAuthorizationCode'}, err))
    })
  }

  function revokeToken (token) {
    log.debug('revokeToken', token)
    return OAuthRefreshTokens.deleteOne({
      refreshToken: token.refreshToken
    }).then(() => {
      // expire the token
      token.refreshTokenExpiresAt = new Date(0)
      return token
    }).catch((err) => {
      log.error(Object.assign({fn: 'revokeToken'}, err))
    })
  }

  function validateScope (user, client, scope) {
    // log.debug('###validateScope', user, client, scope)
    return 'undefined' // TODO add validation
  }

  function verifyScope (token, scope) {
    // log.debug('###verifyScope', token, scope)
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
        const userId = _get(user, '_id')
        if (!userId) {
          throw new Error('no token or userId found')
        }
        log.debug('revokeAllTokens', token)
        return Promise.all([
          OAuthAuthorizationCodes.remove({userId: userId}),
          OAuthRefreshTokens.remove({userId: userId}),
          OAuthAccessTokens.remove({userId: userId}),
          lastSignOutAt({_id: userId})
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
    if (!user || !user._id) return
    return generateAuthorizationCode()
      .then((code) => {
        return OAuthUsers.findOneAndUpdate(
          {_id: user._id},
          {
            lastSignInAt: new Date(),
            logoutToken: code.substr(0, 32),
            remember: !!remember
          },
          {upsert: true}
        )
      })
  }

  function lastSignOutAt (user) {
    return OAuthUsers.findOneAndUpdate(
      {_id: user._id},
      {lastSignOutAt: new Date()},
      {upsert: true}
    )
  }

  function logoutClients (user = {}) {
    return OAuthAccessTokens
      .find({userId: user._id})
      .then((data) => {
        let vals = (data || []).map((row) => row.oauthClientId)
        let clients = Array.from(new Set(vals))
        return OAuthClients.find({ $or: [ {_id: clients} ] })
      })
      .then((clients) => {
        clients = clients.filter((client) => client.logoutURI)
        return {user, clients: clients}
      })
  }

  /*
  function findUser (username) {
    return OAuthUsers
    .findOne({username: username})
    .then((user) => {
      return user
    })
    .catch((err) => {
      log.error(Object.assign({fn: 'findUser', username}, err)
    })
  }
  function upsertUser (user) {
    return OAuthUsers
    .findOneAndUpdate({username: user.username}, user, {upsert: true})
    .then((user) => user)
    .catch((err) => {
      log.error('upsertUser %j', err)
    })
  }
  function deleteUser (username) {
    return OAuthUsers
    .findOneAndDelete({username: username})
    .then((user) => user)
    .catch((err) => {
      log.error('deleteUser %j', err)
    })
  }

  function findClient (query) {
    return OAuthClients.findOne(query).then((client) => {
      log.debug(1, client)
      return client
    })
  }
  function upsertClient (username, client) {
    log.debug('updateClient', username, client)

    return findUser(username)
    .then((user) => {
      client.User = user._id
      return OAuthClients
      .findOneAndUpdate({clientId: client.clientId}, client, {upsert: true})
      .then((client) => client)
      .catch((err) => {
        log.error('updateClient %j', err)
      })
    })
  }
  function deleteClient (clientId) {
    return OAuthClients
    .findOneAndDelete({clientId: clientId})
    .then((client) => client)
    .catch((err) => {
      log.error('deleteClient %j', err)
    })
  }
*/

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
  if (data.userId) {
    data.user = data.userId
    delete data.userId
  }
  if (data.oauthClientId) {
    data.client = data.oauthClientId
    delete data.oauthClientId
  }
}
