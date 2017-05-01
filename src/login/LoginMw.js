/**
* middleware functions for login
*/

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const {
  logRequest,
  objToArray,
  trimUrl,
  httpError,
  basicAuthHeader,
  csrfToken,
  cookie,
  wrapQuery,
  unwrapQuery
} = require('../utils')
const chain = require('connect-chain-if')
const _get = require('lodash.get')
const debug = require('debug')('oauth2__login-mw')

const isEnvDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

// alert messages
const alerts = {
  bad_csrf_token:
    {strong: 'The CSRF token is invalid!', text: 'Please try to resubmit the form'},
  invalid_grant:
    {strong: 'Oops snap!', text: 'Wrong Email address or Password. Please resubmit.'},
  error:
    {strong: 'Oops sorry', text: 'Something went wrong.. Please try again.'}
}

class LoginMw {
  constructor (config) {
    this.client = config.login          // {clientId, clientSecret}
    this.oauth2mw = config.oauth2mw     // {token}
    this.csrfTokenFn = csrfToken(config.csrfTokenSecret)
    this.oauthPath = config.oauthPath || '/oauth'

    ;['get', 'post', 'verifyCsrfToken', 'verifyBody', 'setAuth', 'setCookie', 'refreshCookie', 'error', 'render']
    .forEach((p) => (this[p] = this[p].bind(this)))
  }

  /** get middleware chain */
  get () {
    return [
      cookieParser(),
      logRequest,
      this.refreshCookie,
      this.render
    ]
  }

  /** post middleware chain */
  post () {
    return [
      bodyParser.urlencoded({ extended: false }),
      logRequest,
      this.verifyCsrfToken,
      this.verifyBody,
      this.setAuth,
      this.oauth2mw.token,
      this.setCookie,
      // redirect,
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

    const qs = unwrapQuery(_get(req, 'body.qs'))
    let uri = _get(token, 'client.redirectUris[0]') || '/'
    if (qs && /redirect_uri=/.test(qs)) {
      uri = `${this.oauthPath}?${qs}`
    }
    res.redirect(uri)
  }

  refreshCookie (req, res, next) {
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
        qs: wrappedQuery(req)
      }
      req.query = {}

      chain(
        this.setAuth,
        logRequest,
        this.oauth2mw.token,
        this.setCookie
      )(req, res, next)
    } else {
      next()
    }
  }

  error (err, req, res, next) {
    console.log(err)
    res.status(err.status || 200)
    res.locals = Object.assign({}, res.locals, {alert: alerts[err.name || 'error']})
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
      qs: wrappedQuery(req)
    }
    return objToArray(hidden)
  }
}

module.exports = LoginMw

// helper functions

function wrappedQuery (req) {
  return _get(req, 'query.qs') ||
    _get(req, 'body.qs') ||
    wrapQuery(req.query)
}
