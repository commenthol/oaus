const LoginMw = require('./LoginMw')
const {Router} = require('express')

/**
 * router for login
 * Should be mounted on `paths.login`
 *
 * @param {Object} login
 * @param {Object} login.clientId
 * @param {Object} login.clientSecret
 * @param {Object} oauth2 - @see node_modules / oauth2 - server / lib / server.js
 * @param {Object} model - database model instance - @see src / models / index.js
 * @param {Object} paths - mount paths
 * @param {Object} paths.oauth
 * @param {Object} paths.login
 * @param {Object} paths.loginSuccess
 * @param {Object} paths.logout
 * @return {Object} express router
 * @example
 * const config = {login: {...}, oauth2: {...}, paths: {...}, database: {...}}
 * const app = require('express')()
 * const {login, models} = require('oaus')
 * config.model = models(config.database) // attach db models
 * app.use(login(config))
 */
module.exports = function (config) {
  const router = new Router()
  const mws = new LoginMw(config)

  router.get('/', mws.getChain())
  router.post('/', mws.postChain())

  return router
}
