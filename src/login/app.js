const {resolve} = require('path')
const express = require('express')
const hbs = require('express-hbs')
const bodyParser = require('body-parser')
const login = require('./login')
const {logRequest} = require('../utils')

module.exports = appLogin

/**
* @param {Object} config
* @param {String} config.csrfTokenSecret - csrf token secret
* @param {String} config.client.clientId - oauth2 clientId for login App
* @param {String} config.client.clientSecret - oauth clientSecret
* @param {Object} config.oauth2mw - oauth2 middlewares
* @return {Object} express app
*/
function appLogin (config) {
  const app = express()
  const {client, oauth2mw} = config
  const setCsrfToken = login.setCsrfToken(config.csrfTokenSecret)

  app.set('x-powered-by', false)
  app.set('view engine', 'hbs')
  app.set('views', views())

  app.engine('hbs', hbs.express4({
    partialsDir: [views('partials')],
    defaultLayout: views('layout/default.hbs')
  }))

  app.use(bodyParser.urlencoded({ extended: false }))

  app.get('/',
    setCsrfToken,
    logRequest,
    login.render
  )
  app.post('/',
    setCsrfToken,
    login.verifyCsrfToken,
    login.verifyBody,
    login.setAuth(client),
    oauth2mw.token,
    logRequest,
    login.setCookie,
    // redirect,
    login.error
  )

  return app
}

function views (path) {
  return resolve(__dirname, '..', '..', 'views', path || '')
}
