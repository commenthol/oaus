const {debug, toArray} = require('../../utils')

module.exports = function (db) {
  const {
    Users,
    OAuthClients,
    OAuthAccessTokens,
    OAuthAuthorizationCodes,
    OAuthRefreshTokens
    // OAuthScopes
  } = db

  function getAccessToken (bearerToken) {
    debug('getAccessToken', bearerToken)

    return OAuthAccessTokens
    .findOne({
      where: {accessToken: bearerToken},
      attributes: ['accessToken', ['expiresAt', 'accessTokenExpiresAt'], 'scope'],
      include: [
        {
          model: Users,
          attributes: ['id', 'username']
        }, OAuthClients
      ]
    })
    .then(function (accessToken) {
      debug('accessToken %j', accessToken)
      if (!accessToken) return false
      const token = accessToken.toJSON()
      token.user = token.User
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
    const options = {
      where: {clientId: clientId}
    }
    if (clientSecret) options.where.clientSecret = clientSecret

    return OAuthClients
    .findOne(options)
    .then(function (client) {
      if (!client) {
        return new Error('client not found')
      }
      const clientWithGrants = client.toJSON()
      clientWithGrants.grants = toArray(clientWithGrants.grants)
      // TODO need to create another table for redirect URIs
      clientWithGrants.redirectUris = [clientWithGrants.redirectUri]
      delete clientWithGrants.redirectUri
      debug('getClient %j', clientWithGrants)
      return clientWithGrants
    }).catch(function (err) {
      debug.error('getClient %j', err)
    })
  }

  function getUser (username, password) {
    return Users
    .findOne({
      where: {username: username},
      attributes: ['id', 'username', 'password', 'scope']
    })
    .then(function (user) {
      debug('user %j', user)
      return user.password === password ? user.toJSON() : false
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
    .findOne({
      attributes: ['oauthClientId', 'expiresAt', 'userId', 'scope'],
      where: {authorizationCode: code},
      include: [Users, OAuthClients]
    })
    .then(function (authCodeModel) {
      if (!authCodeModel || !authCodeModel.OAuthClient || !authCodeModel.User) return false
      const client = authCodeModel.OAuthClient.toJSON()
      const user = authCodeModel.User.toJSON()
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
      userId: user.id,
      oauthClientId: client.id,
      scope: code.scope
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
    const options = {
      where: {clientId: client.clientId},
      include: [Users],
      attributes: ['id', 'clientId', 'redirectUri']
    }
    if (client.clientSecret) options.where.clientSecret = client.clientSecret

    return OAuthClients
    .findOne(options)
    .then(function (client) {
      debug(client)
      if (!client || !client.User) return false
      return client.User.toJSON()
    }).catch(function (err) {
      debug.error('getUserFromClient %j', err)
    })
  }

  function getRefreshToken (refreshToken) {
    debug('getRefreshToken %s', refreshToken)
    if (!refreshToken || refreshToken === 'undefined') return false

    return OAuthRefreshTokens
    .findOne({
      attributes: ['oauthClientId', 'userId', 'expiresAt'],
      where: {refreshToken: refreshToken},
      include: [OAuthClients, Users]
    })
    .then(function (savedRT) {
      debug('savedRefreshToken %j', savedRT)
      const tokenTemp = {
        user: savedRT && savedRT.User
          ? savedRT.User.toJSON()
          : {},
        client: savedRT && savedRT.OAuthClient
          ? savedRT.OAuthClient.toJSON()
          : {},
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

  function findClient (query, attributes) {
    return OAuthClients.findOne({
      where: query,
      attributes: attributes || []
    })
  }

  return {
    // generateOAuthAccessToken, // optional - used for jwt
    // generateAuthorizationCode, // optional
    // generateOAuthRefreshToken, // optional
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
    findClient
  }
}
