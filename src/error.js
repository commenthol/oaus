const {httpError} = require('./utils')

/**
* @param {Object} app - express app or router
*/
module.exports = function (app) {
  app.use((req, res, next) => {
    next(httpError(404))
  })

  app.use((err, req, res, next) => {
    err = err || httpError(500)
    res.statusCode = err.status
    res.render('layout/error', {
      status: err.status,
      name: err.name
    })
  })
}
