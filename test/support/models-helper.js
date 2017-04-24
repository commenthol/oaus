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

const objectKeysType = (obj) => {
  const type = toString.call(obj).replace(/^\[object (.*)\]$/, '$1')
  switch (type) {
    case 'Object':
      let o = {}
      Object.keys(obj).forEach((k) => {
        o[k] = objectKeysType(obj[k])
      })
      return o
    case 'Array':
      return obj.map((k) => (objectKeysType(k)))
    default:
      return type
  }
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
  objectKeysType,
  timeout
}
