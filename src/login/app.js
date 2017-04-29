const {resolve} = require('path')
const express = require('express')
const hbs = require('express-hbs')
const bodyParser = require('body-parser')
const login = require('./login')

module.exports = appLogin

/**
* @param {Object} config
* @param {String} config.csrfTokenSecret - csrf token secret
* @param {String} config.client.clientId - oauth2 clientId for login App
* @param {String} config.client.clientSecret - oauth clientSecret
* @param {Object} config.model - oauth2 database models
* @return {Object} express app
*/
function appLogin (config) {
  const app = express()

  app.set('x-powered-by', false)
  app.set('view engine', 'hbs')
  app.set('views', views())

  app.engine('hbs', hbs.express4({
    partialsDir: [views('partials')],
    defaultLayout: views('layout/default.hbs')
  }))

  app.use(bodyParser.urlencoded({ extended: false }))

  app.get('/', login.get)
  app.post('/', login.post)

  return app
}

function views (path) {
  return resolve(__dirname, '..', '..', 'views', path || '')
}
