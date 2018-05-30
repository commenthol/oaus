const {httpError} = require('./utils')

const debug = require('debug-level').log('oaus:error')

/**
* final error handler (no rendering)
* @param {Object} app - express app or router
* @example
* oaus.error(app)
* app.use((_err, req, res, _next) => {
*   res.render('layout/error', res.body)
* })
*/
module.exports = function (app) {
  app.use((req, res, next) => {
    next(httpError(404))
  })

  app.use((err, req, res, next) => {
    err = err || httpError(500)

    if (err.status !== 404) {
      debug.error({
        ip: req.ip,
        error: err.message || err.name,
        status: err.status,
        stack: err.stack
      })
    }

    res.statusCode = err.status
    res.body = {
      status: err.status,
      name: err.name
    }
    next(err)
  })
}
