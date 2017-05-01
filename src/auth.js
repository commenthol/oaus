const Router = require('express').Router
const bodyParser = require('body-parser')

/**
* @param {Object} config
* @param {Object} config.oauth2mw
*/
module.exports = function (config) {
  const router = new Router()
  const {oauth2mw} = config

  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({ extended: false }))

  router.all('/token', oauth2mw.token)
  router.get('/authorize', oauth2mw.authorize)

  return router
}
