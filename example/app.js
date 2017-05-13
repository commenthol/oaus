const express = require('express')
const {resolve} = require('path')
const _merge = require('lodash.merge')
const oauth2 = require('..')

module.exports = setup

const defaultConfig = {
  database: {
    connector: 'mysql',
    url: 'mysql://dev:dev@localhost/oauth2'
    // connector: 'mongodb',
    // url: 'mongodb://localhost/oauth2'
  },
  csrfTokenSecret: 'NEVER CHANGE SECRETS',
  oauth2: {     // oauth2-server settings
    alwaysIssueNewRefreshToken: false // each refresh_token grant does not write new refresh_token
  },
  login: {
    clientId: 'login',
    clientSecret: 'loginsecret'
  }
}

function setup (pConfig) {
  const app = express()

  const config = _merge({}, defaultConfig, pConfig)
  const oauth2mw = new oauth2.OAuth2Mw(config)
  config.oauth2mw = oauth2mw

  app.set('trust proxy', 'loopback, linklocal, uniquelocal')
  app.use(express.static(resolve(__dirname, '../public')))

  oauth2.views(app) // set hbs views
  app.use('/login', oauth2.login(config))
  app.use('/oauth', oauth2.oauth(config))

  app.get('/private', oauth2mw.authenticate, (req, res, next) => {
    // console.log(req.headers)
    res.send('private area')
  })

  oauth2.error(app) // set error pages

  return app
}

if (module === require.main) {
  setup().listen(4000, () => {
    console.log('OAuth2 Server started on :4000')
  })
}
