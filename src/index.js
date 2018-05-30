// middlewares
const oauth = require('./oauth')
const login = require('./login')
const logout = require('./logout')
const error = require('./error')

// utilities
const models = require('./models')
const utils = require('./utils')

const routers = function (config) {
  const { model } = models(config.database)
  Object.assign(config, { model })
  const _oauth = oauth(config)
  const _login = login(config)
  const _logout = logout(config)
  return {
    oauth: _oauth,
    authenticate: _oauth.authenticate,
    login: _login,
    logout: _logout
  }
}

module.exports = {
  routers,
  oauth,
  login,
  logout,
  models,
  utils,
  error
}
