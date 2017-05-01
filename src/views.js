const {resolve} = require('path')
const hbs = require('express-hbs')

/**
* @param {Object} app - express app or router
*/
module.exports = function (app) {
  app.set('x-powered-by', false)
  app.set('view engine', 'hbs')
  app.set('views', views())

  app.engine('hbs', hbs.express4({
    partialsDir: [views('partials')],
    defaultLayout: views('layout/default.hbs')
  }))
}

function views (path) {
  return resolve(__dirname, '../views', path || '')
}
