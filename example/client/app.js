/* eslint no-console: 0 */

const express = require('express')
const session = require('express-session')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const OAuth2Strategy = require('passport-oauth2')
const _get = require('lodash').get
const request = require('superagent')
const views = require('./views')
const log = require('debug')('client')

module.exports = setup

/// set in `/etc/hosts` file
/// 127.0.1.1 auth.local
/// 127.0.0.1 client.local
// const OAUTH2_SERVER = 'http://auth.local:4000'
// const MY_SERVER = 'http://client.local:3000'
const OAUTH2_SERVER = 'http://localhost:4000'
const MY_SERVER = 'http://localhost:3000'
const uri = {
  loginURL: `/login`,
  logoutURL: `${OAUTH2_SERVER}/oauth/authorize?response_type=logout&client_id=demo&redirect_uri=${escape(MY_SERVER)}`,
  authorizationURL: `${OAUTH2_SERVER}/oauth/authorize`,
  tokenURL: `${OAUTH2_SERVER}/oauth/token`
}

// user store - shift this to a database or redis cluster
const userStore = {}

const oauth2strategy = new OAuth2Strategy(
  {
    authorizationURL: uri.authorizationURL,
    tokenURL: uri.tokenURL,
    clientID: 'demo',
    clientSecret: 'demosecret',
    callbackURL: `${MY_SERVER}/auth/callback`,
    state: true
  },
  function verify (accessToken, refreshToken, profile, done) {
    const {username} = profile
    userStore[username] = profile
    done(null, profile)
  }
)
oauth2strategy.userProfile = function (accessToken, done) {
  request
    .get(`${OAUTH2_SERVER}/resource/user`)
    .set('Authorization', `Bearer ${accessToken}`)
    .accept('json')
    .end((err, res) => {
      const {body} = res || {}
      done(err, body)
    })
}

passport.use(oauth2strategy)
passport.serializeUser(function (user, done) {
  const {username} = user
  done(null, username)
})
passport.deserializeUser(function (username, done) {
  let err = null
  const user = userStore[username] || false
  log('deserializeUser %j', user)
  if (!user) {
    err = new Error('err_invalid_session')
  }
  done(err, user)
})

function logRequest (req, res, next) {
  let {method, url, headers, params, query, body, baseUrl, originalUrl} = req
  log('logRequest %j', {method, url, headers, params, query, body, baseUrl, originalUrl})
  next()
}

function setup (app) {
  app = app || express()

  views(app)

  app.use(
    cookieParser(),
    bodyParser.urlencoded({extended: true}),
    session({
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true,
      cookie: {}
    }),
    passport.initialize(),
    passport.session(),
    (err, req, res, next) => {
      if (err && err.message === 'err_invalid_session') {
        err = null
        req.session.destroy()
      }
      next(err)
    })

  app.get('/login',
    passport.authenticate('oauth2')
  )

  app.get('/auth/callback',
    logRequest,
    passport.authenticate('oauth2', {failureRedirect: '/login'}),
    (req, res) => {
      // Successful authentication, redirect home
      res.redirect('/')
    }
  )

  // session logout from server
  app.post('/auth/logout', bodyParser.json(), (req, res, next) => {
    log('logout %j', req.body)
    const {logoutToken} = req.body

    // find user by logoutToken to delete profile
    for (let username in userStore) {
      if (logoutToken === userStore[username].logoutToken) {
        delete userStore[username]
        break
      }
    }
    next()
  })
  app.get('/logout', (req, res, next) => {
    res.redirect(`${OAUTH2_SERVER}/oauth/logout`)
  })

  app.get('/',
    (req, res) => {
      log('session %j', req.session)
      res.render('pages/home', {
        title: 'Client',
        uri,
        username: _get(req, 'session.passport.user')
      })
    }
  )

  return app
}

if (module === require.main) {
  const port = 3000
  setup().listen(port, () => {
    console.log(`OAuth2 Client started at ${MY_SERVER}`)
  })
}
