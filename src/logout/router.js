const LogoutMw = require('./LogoutMw')
const {Router} = require('express')

/**
* router for logout
* Should be mounted on `/login/logout` and before login router!
*
* @param {Object} config
* @param {Object} config.oauth2mw - oauth2 middlewares
* @param {String} [config.oauthPath='/oauth'] - default redirect uri to oauth2 service
* @param {String} config.login.clientId - oauth2 clientId for login App
* @param {String} config.login.clientSecret - oauth clientSecret
* @param {Object} [config.login.successUri='/'] - default redirect uri after successful login
* @return {Object} express router
* @example
* const oauth = require('..')
* config.oauth2mw = new oauth.OAuth2Mw(config)
* const app = require('express')()
* app.use('/login/logout', oaus.logout(config), render)
* app.use('/login', oaus.login(config), render)
*/
module.exports = function (config) {
  const router = new Router()
  const mws = new LogoutMw(config)
  router.get('/', mws.getChain())
  router.post('/', mws.postChain())

  return router
}
