/**
* middleware functions for login
*/

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const url = require('url')
const qs = require('querystring')
const {
  // logRequest,
  objToArray,
  trimUrl,
  httpError,
  basicAuthHeader,
  csrfToken,
  cookie
} = require('../utils')
const chain = require('connect-chain-if')
const _get = require('lodash.get')
const debug = require('debug')('oauth2__login-mw')
debug.error = require('debug')('oauth2__login-mw::error')

const isEnvDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

// alert messages
const alerts = {
  bad_csrf_token:
    {strong: 'The CSRF token is invalid!', text: 'Please try to resubmit the form'},
  invalid_grant:
    {strong: 'Oops snap!', text: 'Wrong Email address or Password. Please resubmit.'},
  session_expired:
    {strong: 'Oops sorry', text: 'Your session has expired, please sign-in again.'},
  server_error:
    {strong: 'Oops sorry', text: 'Something went wrong.. Please try again.'}
}

class LoginMw {
  constructor (config) {
    this.client = config.login          // {clientId, clientSecret}
    this.oauth2mw = config.oauth2mw     // {token}
    this.csrfTokenFn = csrfToken(config.csrfTokenSecret)
    this.oauthPath = config.oauthPath || '/oauth'

    ;['get', 'post', 'verifyCsrfToken', 'verifyBody', 'setAuth', 'setCookie',
      'refreshCookie', 'error', 'render']
    .forEach((p) => (this[p] = this[p].bind(this)))
  }

  /** get middleware chain */
  get () {
    return [
      cookieParser(),
      this.refreshCookie,
      this.render,
      this.error
    ]
  }

  /** post middleware chain */
  post () {
    return [
      bodyParser.urlencoded({extended: false}),
      this.verifyCsrfToken,
      this.verifyBody,
      this.setAuth,
      this.oauth2mw.token,
      this.oauth2mw.lastLoginAt,
      this.setCookie,
      this.error
    ]
  }

  verifyCsrfToken (req, res, next) {
    let err
    const csrf = _get(req, 'body.csrf')
    if (!this.csrfTokenFn.verify(csrf)) {
      err = httpError(400, 'bad_csrf_token')
    }
    next(err)
  }

  verifyBody (req, res, next) {
    let err
    const {username, password} = req.body || {}
    if (!username || !password) {
      err = httpError(400, 'invalid_grant')
    }
    next(err)
  }

  setAuth (req, res, next) {
    req.headers.authorization = basicAuthHeader(this.client)
    next()
  }

  setCookie (req, res, next) {
    const {token} = res.locals
    delete res.locals.token

    debug('setCookie', token)
    if (!token) {
      next(httpError(401, 'invalid_grant'))
      return
    }

    const rememberMe = (_get(req, 'body.remember') === 'on')

    cookie.set(res, 'access', token.accessToken, {
      path: this.oauthPath,
      expires: token.accessTokenExpiresAt,
      httpOnly: true,
      secure: !isEnvDev
    })
    if (token.refreshToken) {
      cookie.set(res, 'refresh', token.refreshToken, {
        path: trimUrl(req.originalUrl || '/'),
        expires: rememberMe ? token.refreshTokenExpiresAt : undefined,
        httpOnly: true,
        secure: !isEnvDev
      })
    }

    let redirectUrl = '/' // TODO set default redirectUrl
    let origin = url.parse(unescape(_get(req, 'body.origin', '')))
    if (origin.pathname) {
      let query = Object.assign(qs.parse(origin.query), {_login: 1})
      origin.search = '?' + qs.stringify(query)
      redirectUrl = url.format(origin)
    }
    res.redirect(redirectUrl)
  }

  refreshCookie (req, res, next) { // GET chain
    const {refresh} = req.cookies // needs `cookie-parser`

    if (refresh) {
      // try to issue next accessToken for user
      // construct a fake request to issue a password grant request
      debug('refreshCookie', req.headers)
      req.method = 'POST'
      req.headers['content-type'] = 'application/x-www-form-urlencoded'
      req.headers['content-length'] = 100 // fake length - will hopefully not get inspected by `type-is` module
      req.body = {
        grant_type: 'refresh_token',
        refresh_token: refresh,
        origin: _get(req, 'query.origin')
      }
      req.query = {}

      chain(
        this.setAuth,
        this.oauth2mw.token,
        this.setCookie,
        (err, req, res, next) => { // eslint-disable-line handle-callback-err
          // debug.error(err)
          next(httpError(200, 'session_expired'))
        }
      )(req, res, next)
    } else {
      next()
    }
  }

  error (err, req, res, next) {
    debug.error('%j', err) // TODO log user, ip as well
    res.status(err.status || 200)
    res.locals = Object.assign({}, res.locals, {alert: alerts[err.name || 'server_error']})
    this.render(req, res)
  }

  render (req, res) {
    const {alert} = res.locals || {} // TODO
    res.render('layout/login', {
      title: 'Login',
      hidden: this._hiddenLogin(req),
      // random: Math.random().toString(16).substr(2, 8),
      alert
    })
  }

  _hiddenLogin (req) {
    const hidden = {
      grant_type: 'password',
      csrf: this.csrfTokenFn.create(),
      origin: _get(req, 'query.origin')
    }
    return objToArray(hidden)
  }
}

module.exports = LoginMw
