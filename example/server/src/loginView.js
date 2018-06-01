/**
* Example Server - render middlewares
*/

const _set = require('lodash').set
const alerts = require('./alerts')
const objToArray = require('./objToArray')

/**
* render the login page
* passes the following values to the template
* @param {Object} res.body - `{hidden: {name: value, name1: value, ...}, alert: {strong, text}}`
*/
function render (req, res) {
  // hidden = [{name, value}, {name, value}, ...]
  const {hidden} = res.body || {}
  if (hidden) res.body.hidden = objToArray(hidden)
  res.render('pages/login',
    Object.assign({title: 'Sign in'}, res.body)
  )
}

/**
* render the error page
* @param {string} err.name - `bad_csrf_token|invalid_grant|session_expired|server_error`
* @param {Object} res.body - `{hidden: {name: value, name1: value, ...}, error: string}`
*/
function error (err, req, res, _next) {
  let alert = err.name
  if (Object.keys(alerts).indexOf(alert) === -1) {
    alert = 'server_error'
  }
  _set(res, 'body.alert', alerts[alert])
  render(req, res)
}

module.exports = {
  render,
  error
}
