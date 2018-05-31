/* eslint no-console: 0 */

const express = require('express')
const morgan = require('morgan')
const log = require('debug')('test:app')
const {
  get: _get,
  pick: _pick
} = require('lodash')
const {loginView, logoutView} = require('./src')
const views = require('./views')
const version = require('../../package.json').version
const oaus = require('../..')
const {
  httpError
} = oaus.utils

module.exports = setup

function logger (req, res, next) { // TODO debug
  log('>>>', req.method, req.url, req.headers, req.body)
  res.on('finish', () => {
    log('<<<', res.statusCode, res.body)
  })
  next()
}

function setup (config) {
  const app = express()
  const routers = oaus.routers(config)

  views(app) // set hbs views

  app.locals.version = version
  app.set('trust proxy', 'loopback, linklocal, uniquelocal')
  app.use(logger, morgan('combined'))

  // logout chain
  app.use(config.paths.logout,
    routers.logout,
    (err, req, res, next) => {
      const redirectUri = _get(req, 'query.redirect_uri')
      if (redirectUri) {
        res.redirect(redirectUri)
      } else {
        next(err)
      }
    },
    logoutView.render,
    logoutView.error
  )

  // login chain
  app.use(config.paths.login,
    routers.login,
    loginView.render,
    loginView.error
  )

  // authorization server
  app.use(config.paths.oauth,
    routers.oauth
  )

  // resource server
  app.get('/resource/user',
    routers.authenticate,
    (req, res, next) => {
      console.log(req.locals.user)
      const body = _pick(req.locals.user, ['username', 'logoutToken'])
      body.scope = req.locals.scope
      res.json(body)
    }
  )

  // general error handler
  app.use((req, err, next) => {
    next(httpError(404))
  })
  oaus.error(app)
  app.use((_err, req, res, _next) => {
    res.render('pages/error', res.body)
  })

  return app
}

if (module === require.main) {
  const port = 4000
  const config = require('./config')
  setup(config).listen(port, () => {
    console.log(`OAuth2 Server started on :${port}`)
  })
}
