// helper functions
const expiresAt = (seconds = 1) => {
  return new Date(Date.now() + (seconds * 1000))
}

const accessToken = (value, expiresIn, scope) => ({
  accessToken: value,
  accessTokenExpiresAt: expiresAt(expiresIn),
  scope: scope || null
})

const refreshToken = (value, expiresIn, scope) => ({
  refreshToken: value,
  refreshTokenExpiresAt: expiresAt(expiresIn),
  scope: scope || null
})

const authorizationCode = (value, expiresIn, redirectUri, scope) => ({
  authorizationCode: value,
  expiresAt: expiresAt(expiresIn),
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
