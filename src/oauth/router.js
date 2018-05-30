const Router = require('express').Router
const bodyParser = require('body-parser')
const Oauth2Mw = require('./Oauth2Mw')

/**
 * Router for token and authorize
 * @param {Object} oauth2 - oauth2 configuration
 * @param {Object} model - model instance
 * @param {Object} [paths] - mount paths
 * @return express router
 * @example
 * const config = {oauth2: {...}, paths: {...}, database: {...}}
 * const app = require('express')()
 * const {oauth, models} = require('oaus')
 * config.model = models(config.database) // attach db models
 * app.use(config.paths.oauth, oauth(config))
 */
module.exports = function ({ oauth2, model, paths }) {
  const router = new Router()
  const mws = new Oauth2Mw({ oauth2, model, paths })
  const limit = '10kb' // 413 if limit exceeded

  router.use('/',
    bodyParser.urlencoded({ extended: false, limit }),
    bodyParser.json({ limit })
  )
  router.all('/token', mws.tokenChain())
  router.get('/authorize', mws.authorizeChain())

  router.authenticate = mws.authenticate.bind(mws) // export authenticate mw

  return router
}
