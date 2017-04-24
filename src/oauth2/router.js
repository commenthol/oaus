const bodyParser = require('body-parser')
const oauth2 = require('./oauth2')

module.exports = routerOauth2

/**
* @param {Object} config
* @param {String} config.connector
* @param {String} config.url
*/
function routerOauth2 (config) {
  const router = require('express').Router()

  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({ extended: false }))

  router.use(oauth2.connect(config))
  router.all('/token', oauth2.token)
  router.get('/authorize', oauth2.authorize)

  return router
}
