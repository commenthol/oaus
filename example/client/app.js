/* eslint no-console:0 */

const express = require('express')
const session = require('express-session')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const OAuth2Strategy = require('passport-oauth2')
const {logRequest} = require('../../').utils

module.exports = setup

passport.use(
  new OAuth2Strategy({
    authorizationURL: 'http://localhost:4000/oauth/authorize',
    tokenURL: 'http://localhost:4000/oauth/token',
    clientID: 'demo',
    clientSecret: 'demosecret',
    callbackURL: 'http://localhost:3000/auth/callback',
    state: true
  },
  function (accessToken, refreshToken, profile, cb) {
    // User.findOrCreate({ exampleId: profile.id }, function (err, user) {
    //   return cb(err, user)
    // });
    console.log(accessToken, refreshToken, profile)
    cb(null, {})
  }
))

function setup (app) {
  app = app || express()

  app.use(cookieParser())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {}
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/auth/example',
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

  app.get('/',
    (req, res) => {
      res.end(page({
        title: 'Home',
        body: `
          <div>
            <a href="/auth/example">authenticate</a>
          </div>
        `
      }))
    }
  )

  return app
}

function main (port) {
  setup().listen(port, () => {
    console.log(`OAuth2 Client started on :${port}`)
  })
}

function page (obj = {}) {
  let page = `
<html>
<head>
  <title>${obj.title}</title>
</head>
<body>
  <h1>${obj.title}</h1>
  ${obj.body}
</body>
</html>
  `
  return page
}

if (module === require.main) {
  main(3000)
}
