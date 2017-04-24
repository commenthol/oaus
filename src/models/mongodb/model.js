const {debug} = require('../../utils')

module.exports = function (db) {
  const {
    Users,
    OAuthClients,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthRefreshTokens,
    OAuthScopes
  } = db

  function getAccessToken (bearerToken) {
    debug('getAccessToken', bearerToken)

    return OAuthAccessTokens
    .findOne({accessToken: bearerToken})
    .populate('userId')
    .populate('oauthClientId')
    .then(function (accessToken) {
      debug('accessToken %j', accessToken)
      if (!accessToken) return false
      const token = accessToken
      token.user = token.userId
      token.client = token.oauthClientId
      token.scope = token.scope
      return token
    })
    .catch(function (err) {
      debug.error('getAccessToken %j', err)
    })
  }

  function getClient (clientId, clientSecret) {
    debug('getClient %s %s', clientId, clientSecret)
    const options = {clientId: clientId}
    if (clientSecret) options.clientSecret = clientSecret

    return OAuthClients
    .findOne(options)
    .then(function (client) {
      if (!client) {
        return new Error('client not found')
      }
      const clientWithGrants = client
      // TODO allow redirectUris
      clientWithGrants.redirectUris = [clientWithGrants.redirectUri]
      delete clientWithGrants.redirectUri
      return clientWithGrants
    }).catch(function (err) {
      debug.error('getClient %j', err)
    })
  }

  function getUser (username, password) {
    return Users
    .findOne({username: username})
    .then(function (user) {
      debug('user %j', user)
      return user.password === password ? user : false
    })
    .catch(function (err) {
      debug.error('getUser %j', err)
    })
  }

  function revokeAuthorizationCode (code) {
    debug('revokeAuthorizationCode', code)
    return OAuthAuthorizationCodes.findOne({
      where: {
        authorizationCode: code.code
      }
    }).then(function (rCode) {
    // if(rCode) rCode.destroy();
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
      const expiredCode = code
      expiredCode.expiresAt = new Date(0)
      return expiredCode
    }).catch(function (err) {
      debug.error('getUser %j', err)
    })
  }

  function revokeToken (token) {
    debug('revokeToken %j', token)
    return OAuthRefreshTokens.findOne({
      where: {
        refreshToken: token.refreshToken
      }
    }).then(function (refreshToken) {
      if (refreshToken) refreshToken.destroy()
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
      const expiredToken = token
      expiredToken.refreshTokenExpiresAt = new Date(0)
      return expiredToken
    }).catch(function (err) {
      debug.error('revokeToken %j', err)
    })
  }

  function saveToken (token, client, user) {
    debug('saveToken %j %j %j', token, client, user)
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
    .then(function (resultsArray) {
      // expected to return client and user, but not returning
      return Object.assign({
        client: client,
        user: user,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
      }, token)
    })
    .catch(function (err) {
      debug.error('revokeToken %j', err)
    })
  }

  function getAuthorizationCode (code) {
    debug('getAuthorizationCode %s', code)
    return OAuthAuthorizationCodes
    .findOne({authorizationCode: code})
    .populate('userId')
    .populate('oauthClientId')
    .then(function (authCodeModel) {
      if (!authCodeModel) return false
      const client = authCodeModel.oauthClientId
      const user = authCodeModel.userId
      return {
        code: code,
        client: client,
        expiresAt: authCodeModel.expiresAt,
        redirectUri: client.redirectUri,
        user: user,
        scope: authCodeModel.scope
      }
    }).catch(function (err) {
      debug.error('getAuthorizationCode %j', err)
    })
  }

  function saveAuthorizationCode (code, client, user) {
    debug('saveAuthorizationCode %s %j %j', code, client, user)
    return OAuthAuthorizationCodes
    .create({
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      userId: user._id,
      oauthClientId: client._id
    })
    .then(function () {
      code.code = code.authorizationCode
      return code
    }).catch(function (err) {
      debug.error('saveAuthorizationCode %j', err)
    })
  }

  function getUserFromClient (client) {
    debug('getUserFromClient %j', client)
    const options = {clientId: client.clientId}
    if (client.clientSecret) options.clientSecret = client.clientSecret

    return OAuthClients
    .findOne(options)
    .populate('userId')
    .then(function (client) {
      debug(client)
      if (!client || !client.userId) return false
      return client.userId
    }).catch(function (err) {
      debug.error('getUserFromClient %j', err)
    })
  }

  function getRefreshToken (refreshToken) {
    debug('getRefreshToken %s', refreshToken)
    if (!refreshToken || refreshToken === 'undefined') return false

    return OAuthRefreshTokens
    .findOne({refreshToken: refreshToken})
    .populate('userId')
    .populate('oauthClientId')
    .then(function (savedRT) {
      debug('savedRefreshToken %j', savedRT)
      const tokenTemp = {
        user: savedRT ? savedRT.userId : {},
        client: savedRT ? savedRT.oauthClientId : {},
        refreshTokenExpiresAt: savedRT ? new Date(savedRT.expiresAt) : null,
        refreshToken: refreshToken,
        scope: savedRT.scope
      }
      return tokenTemp
    }).catch(function (err) {
      debug.error('getRefreshToken %j', err)
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

  // ==== admin requests ====

  function findUser (username) {
    return Users
    .findOne({username: username})
    .then((user) => {
      return user
    })
    .catch((err) => {
      debug.error('findUser %j', err)
    })
  }
  function upsertUser (user) {
    return Users
    .findOneAndUpdate({username: user.username}, user, {upsert: true})
    .then((user) => user)
    .catch((err) => {
      debug.error('upsertUser %j', err)
    })
  }
  function deleteUser (username) {
    return Users
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

  function upsertScope (scope) {
    return OAuthScopes
    .findOneAndUpdate({scope: scope.scope}, scope, {upsert: true})
    .then((scope) => scope)
    .catch((err) => {
      debug.error('upsertScope %j', err)
    })
  }
  function deleteScope (scope) {
    return OAuthScopes
    .findOneAndDelete({scope: scope.scope})
    .then((scope) => scope)
    .catch((err) => {
      debug.error('deleteScope %j', err)
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
    // verifyScope
    findUser,
    upsertUser,
    deleteUser,
    findClient,
    upsertClient,
    deleteClient,
    upsertScope,
    deleteScope
  }
}
