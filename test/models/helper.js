// helper functions
const accessToken = (value, expiresIn, scope) => ({
  accessToken: value,
  accessTokenExpiresAt: new Date(Date.now() + expiresIn || 0),
  scope: scope || null
})

const refreshToken = (value, expiresIn, scope) => ({
  refreshToken: value,
  refreshTokenExpiresAt: new Date(Date.now() + expiresIn || 0),
  scope: scope || null
})

const authorizationCode = (value, expiresIn, redirectUri, scope) => ({
  authorizationCode: value,
  expiresAt: new Date(Date.now() + expiresIn || 0),
  redirectUri: redirectUri || null,
  scope: scope || null
})

const getUserClient = (model, user, client) => {
  const {username, password} = user
  const {clientId, clientSecret} = client
  return Promise.all([
    model.getUser(username, password),
    model.getClient(clientId, clientSecret)
  ])
}

const timeout = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

module.exports = {
  accessToken,
  refreshToken,
  authorizationCode,
  getUserClient,
  timeout
}
