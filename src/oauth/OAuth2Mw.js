/**
* oauth2 connect middlewares
*/

const qs = require('querystring')
const OAuthServer = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const _get = require('lodash.get')
// const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const chain = require('connect-chain-if')
const debug = require('debug')('oaus__auth-mw')
debug.error = require('debug')('oaus__auth-mw::error').bind(undefined, '%j')

const models = require('../models')
const {
  httpError
} = require('../utils')

/**
* connects to database server
* @param {object} config
* @param {object} config.database - database config @see src/models/index.js
* @param {object} config.oauth2 - @see node_modules/oauth2-server/lib/server.js
*/
class oauth2Mw {
  constructor (config) {
    const {model} = models(config.database)
    const oauthServer = new OAuthServer(Object.assign({}, config.oauth2, {model: model}))
    this.config = config
    this.oauthServer = oauthServer
    this.model = model // database model methods

    ;[
      'authenticate',
      'authorize',
      'authorizeChain',
      'lastSignInAt',
      'token',
      'tokenChain',
      '_accessTokenCookie',
      '_authorizeError',
      '_authorizeResponse',
      '_jsonError',
      '_tokenResponse'
    ]
    .forEach((p) => { this[p] = this[p].bind(this) })
  }

  authorizeChain () {
    return chain([
      cookieParser(),
      this._accessTokenCookie,
      this.authorize,
      this._authorizeResponse,
      this._authorizeError
    ])
  }

  tokenChain () {
    return chain([
      this.token,
      this._tokenResponse,
      this._jsonError
    ])
  }

  authenticate (req, res, next) {
    this.oauthServer.authenticate(new Request(req), new Response(res))
    .then((data) => {
      const {scope, user, client} = data
      req.locals = Object.assign({scope, user, client}, req.locals)
      debug('authenticate', req.locals)
      next()
    })
    .catch((err) => next(err))
  }

  authorize (req, res, next) {
    this.oauthServer.authorize(new Request(req), new Response(res))
    .then((code) => {
      req.locals = Object.assign({code}, req.locals)
      debug('authorize', req.locals)
      next()
    })
    .catch((err) => next(err))
  }

  /**
  * sets last sign-in date of user in database
  * requires `req.locals.locals.token.user` to be set to a valid userId of a previous
  * authentication (call `token()` first)
  */
  lastSignInAt (req, res, next) {
    const user = _get(req, 'locals.token.user')
    this.model.lastSignInAt(user)
    .then(() => {
      next && next()
    })
    .catch((err) => {
      next && next(err)
    })
  }

  _authorizeResponse (req, res, next) {
    const {code} = req.locals
    const url = redirectUri(
      code.redirectUri,
      {code: code.code, state: _get(req, 'query.state')}
    )
    debug('%j', {
      ip: req.ip,
      fn: '_authorizeResponse',
      redirect: code.redirectUri
    })
    res.redirect(url)
  }

  _authorizeError (err, req, res, next) {
    err = err || httpError(500, 'server_error')
    let url
    if (err.name === 'invalid_token' && !_get(req, 'query._login')) {
      url = redirectUri('/login', {origin: req.originalUrl})
    } else {
      debug.error({
        ip: req.ip,
        fn: '_authorizeError',
        error: err.message,
        code: err.code,
        status: err.status,
        stack: err.stack
      })
      url = redirectUri(
        _get(req, 'query.redirect_uri'), {
          error: err.name,
          state: _get(req, 'query.state'),
          error_description: err.message
        })
    }
    res.redirect(url)
  }

  token (req, res, next) {
    this.oauthServer.token(new Request(req), new Response(res))
    .then((token) => {
      if (!token || !token.accessToken) throw httpError(401, 'invalid_grant')
      req.locals = Object.assign({token}, req.locals)
      next()
    })
    .catch((err) => next(err))
  }

  _tokenResponse (req, res, next) {
    const {token} = req.locals
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

    debug('%j', {
      ip: req.ip,
      fn: '_tokenResponse'
    })

    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')
    res.json(_token)
  }

  _jsonError (err, req, res, next) {
    err = err || httpError(500, 'server_error')
    debug.error({
      ip: req.ip,
      fn: '_jsonError',
      error: err.message,
      status: err.status,
      stack: err.stack
    })
    res.statusCode = err.status
    const body = noUndefined({
      error: err.name,
      state: _get(req, 'query.state')
    })
    res.json(body)
  }

  /**
  * convert access token cookie to authentication header
  */
  _accessTokenCookie (req, res, next) {
    const {cookieToken, hasToken} = getAuthToken(req)
    if (!hasToken) {
      if (cookieToken) {
        req.headers.authorization = `Bearer ${cookieToken}`
      } else {
        let url = redirectUri(
          '/login', // TODO make configurable
          {origin: req.originalUrl}
        )
        res.redirect(url)
        return
      }
    }
    next()
  }
}

module.exports = oauth2Mw

/**
* @private
*/
function getAuthToken (req) {
  const cookieToken = _get(req, 'cookies.access')
  const headerToken = _get(req, 'headers.authorization')
  const queryToken = _get(req, 'query.access_token')
  const bodyToken = _get(req, 'body.access_token')
  const hasToken = !!(headerToken || queryToken || bodyToken)
  return {hasToken, cookieToken, headerToken, queryToken, bodyToken}
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
* compose redirect url
* @private
*/
function redirectUri (uri = '/', obj) {
  obj = noUndefined(obj)
  if (obj) {
    uri += '?' + qs.stringify(obj)
  }
  return uri
}
