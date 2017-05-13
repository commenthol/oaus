const LoginMw = require('./LoginMw')
const Router = require('express').Router

/**
* router for login
* @param {Object} config
* @param {Object} config.oauth2mw - oauth2 middlewares
* @param {String} config.csrfTokenSecret - csrf token secret
* @param {String} [config.oauthPath='/oauth'] - default redirect uri to oauth2 service
* @param {String} config.login.clientId - oauth2 clientId for login App
* @param {String} config.login.clientSecret - oauth clientSecret
* @param {Object} [config.login.successUri='/'] - default redirect uri after successful login
* @return {Object} express router
*/
module.exports = function (config) {
  const router = new Router()
  const mws = new LoginMw(config)

  router.get('/', mws.getChain())
  router.post('/', mws.postChain())

  return router
}
