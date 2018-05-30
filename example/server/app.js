/* eslint no-console: 0 */

const express = require('express')
const morgan = require('morgan')
const {
  get: _get,
  pick: _pick,
  merge: _merge
} = require('lodash')
const {loginView, logoutView} = require('./src')
const views = require('../views')
const version = require('../../package.json').version
const oaus = require('../..')

module.exports = setup

const defaultConfig = {
  database: {
    secret: 'keyboard cat', // secret to valiate tokens
    connector: 'mysql',
    url: 'mysql://root:dev@localhost/oauth2'
    // storedProcedures: true,
    // logging: false
    // connector: 'mongodb',
    // url: 'mongodb://localhost/oauth2'
  },
  csrfTokenSecret: 'keyboard cat',
  oauth2: { // oauth2-server settings
    accessTokenLifetime: 60, // 60 * 15, // 15 min
    refreshTokenLifetime: 300 // 60 * 60 * 24 * 14  // 2 weeks.
  },
  login: {
    clientId: 'login',
    clientSecret: 'loginsecret'
  }
}

function logger (req, res, next) { // TODO debug
  console.log('>>>', req.method, req.url, req.originalUrl)
  // console.log('<<<', res.statusCode, req.body)
  next()
}

function setup (pConfig) {
  const app = express()

  const config = _merge({}, defaultConfig, pConfig)
  const oauth2mw = new oaus.OAuth2Mw(config)
  config.oauth2mw = oauth2mw

  app.locals.version = version
  app.set('trust proxy', 'loopback, linklocal, uniquelocal')
  app.use(morgan('combined'))

  views(app) // set hbs views

  app.use(logger) // TODO debug

  // logout chain
  app.use('/login/logout',
    oaus.logout(config),
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
  app.use('/login',
    oaus.login(config),
    loginView.render,
    loginView.error
  )
  // authorization server
  app.use('/oauth', oaus.oauth(config))
  // resource server
  app.get('/resource/user',
    oauth2mw.authenticate,
    (req, res, next) => {
      console.log(req.locals.user)
      const body = _pick(req.locals.user, ['username', 'logoutToken'])
      body.scope = req.locals.scope
      res.json(body)
    }
  )
  // general error handler
  oaus.error(app)
  app.use((_err, req, res, _next) => {
    res.render('layout/error', res.body)
  })

  return app
}

function main (port) {
  setup().listen(port, () => {
    console.log(`OAuth2 Server started on :${port}`)
  })
}

if (module === require.main) {
  main(4000)
}
