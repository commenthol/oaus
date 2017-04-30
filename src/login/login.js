/**
* middleware functions for login
*/

const {objToArray, debug, basicAuthHeader, csrfToken, cookie, wrapQuery, unwrapQuery} = require('../utils')
const {resolve} = require('path')
const httpError = require('http-errors')
const errOK200 = new Error('ok')
const _get = require('lodash.get')

const isEnvDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

// alert messages
const alerts = {
  'bad csrf token':
    {strong: 'Caution!', text: 'CSRF token is invalid'},
  'no username or password':
    {strong: 'Oops snap!', text: 'Username or password is missing'},
  badcreds:
    {strong: 'Oops snap!', text: 'Wrong Email address or Password'},
  error:
    {strong: 'Oops sorry', text: 'Something went wrong..'}
}

// middleware chains
module.exports = {
  render,
  setCsrfToken,
  verifyCsrfToken,
  verifyBody,
  setAuth,
  setCookie,
  error
}

function setCsrfToken (secret) {
  const tokenFn = csrfToken(secret)
  return (req, res, next) => {
    if (!req.locals) req.locals = {}
    req.locals.csrfToken = tokenFn
    next()
  }
}

function verifyCsrfToken (req, res, next) {
  let err
  const csrf = _get(req, 'body.csrf')
  if (!req.locals.csrfToken.verify(csrf)) {
    err = httpError(400, 'bad csrf token')
  }
  next(err)
}

function verifyBody (req, res, next) {
  let err
  const {username, password} = req.body || {}
  if (!username || !password) {
    err = httpError(400, 'no username or password')
  }
  next(err)
}

/**
* @param {Object} client - {clientId, clientSecret}
*/
function setAuth (client) {
  return (req, res, next) => {
    req.headers.authorization = basicAuthHeader(client)
    next()
  }
}

function setCookie (req, res, next) {
  const {token} = res.locals
  delete res.locals.token
  const rememberMe = (_get(req, 'body.remember') === 'on')

  cookie.set(res, 'access', token.accessToken, {
    path: resolve(req.baseUrl, '..'),
    expires: token.accessTokenExpiresAt,
    httpOnly: true,
    secure: !isEnvDev
  })
  if (token.refreshToken) {
    cookie.set(res, 'refresh', token.refreshToken, {
      path: req.baseUrl || '/',
      expires: rememberMe ? token.refreshTokenExpiresAt : undefined,
      httpOnly: true,
      secure: !isEnvDev
    })
  }

  next()
}

function error (err, req, res, next) {
  console.log(err)
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
    csrf: req.locals.csrfToken.create(),
    qs: query.qs || wrapQuery(query)
  }
  debug('hidden', hidden)
  return objToArray(hidden)
}
