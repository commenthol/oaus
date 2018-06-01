/**
 * middleware functions for login
 */

const url = require('url')
const qs = require('querystring')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const signedToken = require('signed-token')
const { Router } = require('express')
const _get = require('lodash.get')
const { Oauth2Mw } = require('../oauth')

const {
  basicAuthHeader,
  cookie,
  httpError,
  isAjaxReq,
  isSecure,
  wrapError
} = require('../utils')

const log = require('debug-level').log('oaus:loginMw')

/**
 * Connect middleware functions for login
 * @param {Object} login
 * @param {Object} login.clientId
 * @param {Object} login.clientSecret
 * @param {Object} oauth2 - @see node_modules / oauth2 - server / lib / server.js
 * @param {Object} model - database model instance - @see src / models / index.js
 * @param {Object} paths - mount paths
 * @param {Object} paths.oauth
 * @param {Object} paths.login
 * @param {Object} paths.loginSuccess
 * @param {Object} paths.logout
 */
function LoginMw ({ login, oauth2, model, paths }) {
  if (!login || typeof login !== 'object') throw new Error('login missing')
  if (!login.clientId) throw new Error('needs login.clientId')
  if (!login.clientSecret) throw new Error('needs login.clientSecret')
  if (!login.csrfSecret) throw new Error('needs login.csrfSecret')

  Oauth2Mw.call(this, { oauth2, model, paths })
  Object.assign(this, {
    login,
    _csrfTokenFn: signedToken(login.csrfSecret)
  })
  Object.keys(LoginMw.prototype).forEach((p) => (this[p] = this[p].bind(this)))
  this._initRefeshTokenChain()
}

Object.setPrototypeOf(LoginMw.prototype, Oauth2Mw.prototype)

Object.assign(LoginMw.prototype, {
  /**
   * get middleware chain
   */
  getChain () {
    return [
      cookieParser(),
      this.createCsrf,
      this.refreshCookieGrant,
      this.refreshToken,
      this.render,
      this.error
    ]
  },

  /**
   * post middleware chain
   */
  postChain () {
    const limit = '10kb' // 413 if limit exceeded
    return [
      cookieParser(),
      bodyParser.urlencoded({ extended: false, limit }),
      bodyParser.json({ limit }),
      this.createCsrf,
      this.verifyCsrf,
      this.verifyBody,
      this.setContentTypeForm,
      this.setAuth,
      this.setLocals,
      this.token,
      this.lastSignInAt,
      this.setCookies,
      this.error
    ]
  },

  /**
   * create csrf token + secret
   */
  createCsrf (req, res, next) {
    let secret = _get(req, 'cookies.state')
    if (!secret || !this._csrfTokenFn.verifySync(secret)) {
      secret = this._csrfTokenFn.createSync()
      cookie.set(res, 'state', secret, { // Set-Cookie state=`secret`
        path: this.paths.login,
        httpOnly: true,
        secure: isSecure(req)
      })
    }
    req.csrfToken = () => signedToken(secret).createSync()
    next()
  },

  /**
   * verify csrf token.
   * If invalid error.name `bad_csrf_token` is thrown
   */
  verifyCsrf (req, res, next) {
    let err
    const secret = _get(req, 'cookies.state')
    const csrf = _get(req, 'body.state')
    if (!secret || !csrf ||
      !this._csrfTokenFn.verifySync(secret) ||
      !signedToken(secret).verifySync(csrf)
    ) {
      err = httpError(400, 'bad_csrf_token')
    }
    next(err)
  },

  /**
   * verify body and check if username, password is set
   */
  verifyBody (req, res, next) {
    let err
    const {username, password} = req.body || {}
    if (!username || !password) {
      err = httpError(400, 'invalid_grant')
    }
    next(err)
  },

  /**
   * set correct content-type for ajax requests
   */
  setContentTypeForm (req, res, next) {
    if (isAjaxReq(req.headers)) {
      req.headers['content-type'] = 'application/x-www-form-urlencoded'
      req.headers['X-Requested-With'] = 'XMLHttpRequest'
    }
    next()
  },

  /**
   * set locals needed for setCookie
   */
  setLocals (req, res, next) {
    // ensure you run TLS on your site in production
    const remember = (req.method === 'POST' && _get(req, 'body.remember') === 'on')
    req.locals = Object.assign({remember}, req.locals)
    next()
  },

  /**
   * set client authentication
   */
  setAuth (req, res, next) {
    req.headers.authorization = basicAuthHeader(this.login)
    next()
  },

  /**
   * Sets the cookies for further authentication redirects.
   */
  setCookies (req, res, next) {
    const { token, remember } = req.locals
    const _isSecure = isSecure(req)

    log.debug('setCookies', token)
    if (!token) {
      next(httpError(401, 'invalid_grant'))
      return
    }

    cookie.set(res, 'access', token.accessToken, {
      path: this.paths.oauth,
      expires: token.accessTokenExpiresAt,
      httpOnly: true,
      secure: _isSecure
    })
    if (token.refreshToken) {
      const _remember = _get(token, 'user.remember') || remember

      cookie.set(res, 'refresh', token.refreshToken, {
        path: this.paths.login,
        expires: _remember ? token.refreshTokenExpiresAt : undefined,
        httpOnly: true,
        secure: _isSecure
      })
    }

    let redirectUrl = this.paths.loginSuccess
    let origin = url.parse(unescape(_get(req, 'query.origin', '')))
    if (origin.pathname) {
      let query = Object.assign(qs.parse(origin.query), {_login: 1})
      origin.search = '?' + qs.stringify(query)
      redirectUrl = url.format(origin)
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')

    res.redirect(redirectUrl)
  },

  /**
   * deletes access, refresh cookie
   */
  deleteCookies (req, res, next) {
    const { refresh } = req.cookies || {} // needs `cookie-parser`

    cookie.set(res, 'access', '', {
      path: this.paths.oauth,
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true
    })

    if (refresh) {
      cookie.set(res, 'refresh', '', {
        path: this.paths.login,
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true
      })
    }
    next()
  },

  /**
   * Prepares `grant_type=refresh_token` using token from refreshCookieGrant to obtain
   * fresh `accessToken`
   */
  refreshCookieGrant (req, res, next) { // GET chain
    const {refresh} = req.cookies || {} // needs `cookie-parser`

    if (refresh) {
      const origin = _get(req, 'query.origin')
      // try to issue next accessToken for user
      // construct a fake request to issue a password grant request
      log.debug('refreshCookieGrant', req.headers)
      req.method = 'POST'
      req.headers['content-type'] = 'application/x-www-form-urlencoded'
      req.headers['content-length'] = 100 // fake length - will hopefully not get inspected by `type-is` module
      req.body = {
        grant_type: 'refresh_token',
        refresh_token: refresh
      }
      req.query = {origin}
    }
    next()
  },

  /**
   * initialize verify refreshToken chain using express router
   */
  _initRefeshTokenChain () {
    const router = new Router()
    router.use(
      this.setAuth,
      this.setLocals,
      this.token,
      this.setCookies,
      (err, req, res, next) => {
        log.info('refreshToken', {
          ip: req.ip,
          error: err.message
        })
        next(httpError(200, 'session_expired'))
      }
    )
    this._refeshTokenRouter = router
  },

  /**
   * sets new access & refresh cookie if present refresh cookie is valid
   */
  refreshToken (req, res, next) {
    const {grant_type, refresh_token} = req.body || {}
    if (grant_type === 'refresh_token' && typeof refresh_token === 'string') {
      this._refeshTokenRouter.handle(req, res, next)
    } else {
      next()
    }
  },

  /**
   * @return sets:
   *   {Object} res.body.hidden - `{name: value}` - hidden input values need to be set in POST request
   *   {String} res.body.error - `  bad_csrf_token|session_expired|
   *     access_denied|server_error|unauthorized_client|invalid_client|invalid_token|
   *     invalid_argument|unsupported_grant_type|unauthorized_request|invalid_request|
   *     invalid_scope|invalid_grant|insufficient_scope|unsupported_response_type`
   */
  error (err, req, res, next) {
    log.error(wrapError(err, { ip: req.ip, fn: 'error' }))
    res.status(err.status || 200)
    res.body = {
      error: err.name || 'server_error',
      hidden: _hiddenLogin(req)
    }
    next(err)
  },

  /**
   * @return sets:
   *   {Object} res.body.hidden - `{name: value}` needs to be rendered as hidden <input> forms
   */
  render (req, res, next) {
    res.body = { hidden: _hiddenLogin(req) }
    next()
  }
})

module.exports = LoginMw
LoginMw.getRefreshToken = Oauth2Mw.getRefreshToken

/**
 * set hidden form key-value pairs
 * @private
 */
function _hiddenLogin (req) {
  const grant_type = 'password'
  const response_type = _get(req, 'body.response_type')
  const state = req.csrfToken && req.csrfToken()
  const origin = _get(req, 'query.origin')
  if (response_type) {
    return { response_type, state, origin }
  } else {
    return { grant_type, state, origin }
  }
}
