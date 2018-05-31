const {resolve} = require('path')
const express = require('express')
const exphbs = require('express-handlebars')

/**
* @param {Object} app - express app or router
*/
module.exports = function (app) {
  app.set('x-powered-by', false)
  app.set('view engine', 'hbs')
  app.set('views', views())

  app.engine('.hbs', exphbs({
    partialsDir: [views('partials')],
    helpers: {
      json: function () { return JSON.stringify(this, null, 2) }
    },
    extname: '.hbs'
  }))

  app.use(express.static(resolve(__dirname, '..', 'static')))
}

function views (path) {
  return resolve(__dirname, path || '')
}
