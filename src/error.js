const {httpError} = require('./utils')

const debug = require('debug')('oaus__error')
debug.error = require('debug')('oaus__error::error').bind(undefined, '%j')

/**
* @param {Object} app - express app or router
*/
module.exports = function (app) {
  app.use((req, res, next) => {
    next(httpError(404))
  })

  app.use((err, req, res, next) => {
    err = err || httpError(500)

    debug.error({
      ip: req.ip,
      error: err.message || err.name,
      status: err.status
    })

    res.statusCode = err.status
    res.render('layout/error', {
      status: err.status,
      name: err.name
    })
  })
}
