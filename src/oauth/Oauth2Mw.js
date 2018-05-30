/**
 * oauth2 connect middlewares
 */

const urL = require('url')
const qs = require('querystring')
const OAuthServer = require('@commenthol/oauth2-server')
const { Request, Response } = require('@commenthol/oauth2-server')
const _get = require('lodash.get')
const cookieParser = require('cookie-parser')

const log = require('debug-level').log('oaus:oauth2Mw')

const {
  httpError,
  wrapError
} = require('../utils')

/**
 * Oauth2 middlewares
 * @param {Object} oauth2 - @see node_modules/oauth2-server/lib/server.js
 * @param {Object} model - database model instance - @see src/models/index.js
 * @param {Object} paths - mount paths
 * @param {Object} paths.oauth
 * @param {Object} paths.login
 * @param {Object} paths.logout
 * @example
 * const models = require('../models')
 * const {database, oauth2, paths} = config
 * const {model} = models(database)
 * const mw = oauth2Mw({oauth2, model, paths})
 */
function Oauth2Mw ({oauth2, model, paths}) {
  if (!oauth2 || typeof oauth2 !== 'object') throw new Error('oauth2 missing')
  if (!model || typeof model !== 'object') throw new Error('model missing')
  if (!paths || typeof paths !== 'object') throw new Error('paths missing')

  oauth2.model = model
  Object.assign(this, {
    model,
    paths,
    oauthServer: new OAuthServer(oauth2)
  })
  Object.keys(Oauth2Mw.prototype).forEach((p) => (this[p] = this[p].bind(this)))
}

Oauth2Mw.prototype = {
  authorizeChain () {
    return [
      cookieParser(),
      this._authorizeLogout,
      this._accessTokenCookie,
      this.authorize,
      this._authorizeResponse,
      this._authorizeError
    ]
  },

  tokenChain () {
    return [
      this.token,
      this._tokenResponse,
      this._jsonError
    ]
  },

  /**
   * authenticate with accessToken
   */
  authenticate (req, res, next) {
    this.oauthServer.authenticate(new Request(req), new Response(res))
      .then((data) => {
        const { scope, user, client } = data
        req.locals = Object.assign({ scope, user, client }, req.locals)
        log.debug('authenticate', req.locals)
        next()
      })
      .catch((err) => next(err))
  },

  /**
   * authorize a client
   */
  authorize (req, res, next) {
    this.oauthServer.authorize(new Request(req), new Response(res))
      .then((code) => {
        req.locals = Object.assign({ code }, req.locals)
        log.debug('authorize', req.locals)
        next()
      })
      .catch((err) => next(err))
  },

  /**
   * redirect to logout to delete refreshCookie
   */
  _authorizeLogout (req, res, next) {
    const { response_type } = req.query || {}
    if (response_type === 'logout') { // custom type
      const urlO = urL.parse(this.paths.logout)
      urlO.query = req.query || {}
      const redirectUrl = urlO.format()
      log.debug('_authorizeLogout redirectUrl %s', redirectUrl)
      res.redirect(redirectUrl)
    } else {
      next()
    }
  },

  /**
   * sets last sign-in date of user in database
   * requires `req.locals.locals.token.user` to be set to a valid userId of a previous
   * authentication (call `token()` first)
   */
  lastSignInAt (req, res, next) {
    const user = _get(req, 'locals.token.user')
    const remember = _get(req, 'locals.remember')
    this.model.lastSignInAt(user, remember)
      .then(() => {
        next && next()
      })
      .catch((err) => {
        next && next(err)
      })
  },

  /**
   * redirect to client with authorizationCode
   * @private
   */
  _authorizeResponse (req, res, next) {
    const { code } = req.locals
    const url = redirectUri(
      code.redirectUri,
      { code: code.code, state: _get(req, 'query.state') }
    )
    log.info({
      ip: req.ip,
      fn: '_authorizeResponse',
      redirect: code.redirectUri
    })
    res.redirect(url)
  },

  /**
   * handle authorize error
   * @private
   */
  _authorizeError (err, req, res, next) {
    err = err || httpError(500, 'server_error')
    let url
    if (err.name === 'invalid_token' && !_get(req, 'query._login')) {
      url = redirectUri(this.paths.login, { origin: req.originalUrl })
    } else {
      log.error(wrapError(err, { ip: req.ip, fn: '_authorizeError' }))
      url = redirectUri(
        _get(req, 'query.redirect_uri'), {
          error: err.name,
          state: _get(req, 'query.state'),
          error_description: err.message
        })
    }
    res.redirect(url)
  },

  /**
   * token
   */
  token (req, res, next) {
    this.oauthServer.token(new Request(req), new Response(res))
      .then((token) => {
        if (!token || !token.accessToken) {
          next(httpError(401, 'invalid_grant'))
        } else {
          req.locals = Object.assign({ token }, req.locals)
          next()
        }
      })
      .catch((err) => next(err))
  },

  /**
   * check for valid refresh token
   * @private
   */
  _refreshToken (req, res, next) {
    const { hasToken, cookieToken, bodyToken } = getRefreshToken(req)
    if (hasToken) {
      this.model.getRefreshToken(bodyToken || cookieToken)
        .then((data) => {
          if (!req.locals) req.locals = {}
          Object.assign(req.locals, { user: data.user })
        })
        .catch((err) => {
          log.error(wrapError(err, { ip: req.ip, fn: 'error' }))
          next(httpError(401, 'invalid_token'))
        })
    } else {
      next(httpError(401, 'invalid_request'))
    }
  },

  /**
   * @private
   */
  _tokenResponse (req, res, next) {
    const { token } = req.locals
    const expiresIn = Math.round((token.accessTokenExpiresAt.getTime() - Date.now()) / 1000)

    const _token = {
      token_type: 'bearer',
      access_token: token.accessToken,
      expires_in: expiresIn
    }
    if (token.refreshToken) {
      _token.refresh_token = token.refreshToken
    }
    if (token.scope) {
      // TODO add scope here
    }

    log.debug({
      ip: req.ip,
      fn: '_tokenResponse'
    })

    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')
    res.json(_token)
  },

  /**
   * final error handler
   * @private
   */
  _jsonError (err, req, res, next) {
    err = err || httpError(500, 'server_error')
    log.error(wrapError(err, { ip: req.ip, fn: '_jsonError' }))
    res.statusCode = err.status
    const body = noUndefined({
      error: err.name,
      state: _get(req, 'query.state')
    })
    res.json(body)
  },

  /**
   * convert access token cookie to authentication header
   * @private
   */
  _accessTokenCookie (req, res, next) {
    const { cookieToken, token } = getAccessToken(req)
    if (cookieToken) {
      req.headers.authorization = `Bearer ${cookieToken}`
    } else if (!token) { // user needs to login first
      let url = redirectUri(
        this.paths.login,
        { origin: req.originalUrl }
      )
      res.redirect(url)
      return
    }
    next()
  }
}

module.exports = Oauth2Mw
Oauth2Mw.getRefreshToken = getRefreshToken

/**
 * @private
 */
function getAccessToken (req) {
  const cookieToken = _get(req, 'cookies.access')
  const headerToken = _get(req, 'headers.authorization')
  const queryToken = _get(req, 'query.access_token')
  const bodyToken = _get(req, 'body.access_token')
  const token = bodyToken || headerToken || queryToken || cookieToken
  return {token, cookieToken}
}

/**
 * @private
 */
function getRefreshToken (req) {
  const cookieToken = _get(req, 'cookies.refresh')
  const bodyToken = _get(req, 'body.refresh_token')
  return bodyToken || cookieToken
}

/**
 * @private
 */
function noUndefined (obj) {
  let _obj
  Object.keys(obj).forEach((p) => {
    if (obj[p]) {
      _obj = _obj || {}
      _obj[p] = obj[p]
    }
  })
  return _obj
}

/**
 * compose redirect url - append `obj` as query params.
 * `uri` itself shall not contain query params.
 * @private
 */
function redirectUri (uri = '/', obj) {
  obj = noUndefined(obj)
  if (obj) {
    uri += '?' + qs.stringify(obj)
  }
  return uri
}
