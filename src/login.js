/**
* middleware functions for login
*/

const {objToArray, debug, logRequest} = require('./utils')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const {HttpError} = require('http-error')
const ok200 = new HttpError('OK', 200)

// alert messages
const alerts = {
  csrf: {strong: 'Caution!', text: 'CSRF token is invalid'},
  nouser: {strong: 'Oops snap!', text: 'Username or password is missing'},
  badcreds: {strong: 'Oops snap!', text: 'Wrong Email address or Password'},
  error: {strong: 'Oops sorry', text: 'Something went wrong..'}
}

// middleware chains
module.exports = {
  get: [logRequest, render],
  post: [logRequest, verify, error]
}

function verify (req, res, next) {
  const {body} = req
  const {username, password, csrf} = body

  if (!req._csrfToken.verify(csrf)) {
    res.body = {alert: alerts.csrf}
    next(ok200)
  } else if (!username || !password) {
    res.body = {alert: alerts.nouser}
    next(ok200)
  } else {
    req.headers.authorization = 'Basic ' + (Buffer.from('login:login')).toString('base64')
    const request = new Request(req)
    const response = new Response(res)
    req._model.oauth.token(request, response)
    .then(function (token) {
      console.log(token)
      res.end()
    })
    .catch((err) => {
      debug.error('login-verify %j', err)
      res.body = res.body || {alert: alerts.error}
      if (/user credentials are invalid/.test(err.message)) {
        res.body = {alert: alerts.badcreds}
      }
      next(ok200)
    })
  }
}

function error (err, req, res, next) {
  res.status(err.status || 200)
  render(req, res)
}

function render (req, res) {
  const {alert} = res.body || {}
  res.render('layout/login', {
    title: 'Login',
    hidden: hiddenLogin(req),
    alert
  })
}

// helper functions

function hiddenLogin (req) {
  const {query} = req
  const hidden = {
    grant_type: 'password',
    csrf: req._csrfToken.create(),
    client_id: query.client_id,
    redirect_uri: query.redirect_uri
  }
  debug('hidden', hidden)
  return objToArray(hidden)
}
