const {resolve} = require('path')
const express = require('express')
const hbs = require('express-handlebars')

/**
* @param {Object} app - express app or router
*/
module.exports = function (app) {
  app.set('x-powered-by', false)
  app.set('view engine', 'hbs')
  app.set('views', views())

  app.engine('hbs', hbs({
    partialsDir: [views('partials')],
    defaultLayout: views('layout/default.hbs')
  }))

  app.use(express.static(resolve(__dirname, 'static')))
}

function views (path) {
  return resolve(__dirname, 'views', path || '')
}
