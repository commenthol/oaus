const Router = require('express').Router
const bodyParser = require('body-parser')

/**
* @param {Object} config
* @param {Object} config.oauth2mw
*/
module.exports = function (config) {
  const router = new Router()
  const {oauth2mw} = config

  if (!oauth2mw) throw new Error('oauth needs config.oauth2mw')

  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({ extended: false }))

  router.all('/token', oauth2mw.tokenChain())
  router.get('/authorize', oauth2mw.authorizeChain())

  return router
}
