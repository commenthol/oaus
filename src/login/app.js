const {resolve} = require('path')
const express = require('express')
const hbs = require('express-hbs')
const bodyParser = require('body-parser')
const login = require('./login')

module.exports = appLogin

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
  app.post('/', login.post(config.login.client))

  return app
}

function views (path) {
  return resolve(__dirname, '..', '..', 'views', path || '')
}
