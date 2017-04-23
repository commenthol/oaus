const bodyParser = require('body-parser')
const oauth2 = require('./oauth2')
const login = require('./login')

module.exports = oauth2router

/**
* @param {Object} config
* @param {String} config.connector
* @param {String} config.url
*/
function oauth2router (config) {
  const router = require('express').Router()

  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({ extended: false }))

  router.use(oauth2.connect(config))
  router.all('/token', oauth2.token)
  router.get('/authorize', oauth2.authorize)

  router.get('/login', login.get)
  router.post('/login', login.post)

  return router
}
