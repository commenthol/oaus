const LoginMw = require('./LoginMw')
const Router = require('express').Router

/**
* @param {Object} config
* @param {Object} config.oauth2mw - oauth2 middlewares
* @param {String} config.csrfTokenSecret - csrf token secret
* @param {String} config.login.clientId - oauth2 clientId for login App
* @param {String} config.login.clientSecret - oauth clientSecret
* @param {Object} [config.login.redirectUri='/'] - default redirect uri // TODO
* @return {Object} express router
*/
module.exports = function (config) {
  const router = new Router()
  const mws = new LoginMw(config)

  router.get('/', mws.get())
  router.post('/', mws.post())

  return router
}

module.exports.LoginMw = LoginMw
