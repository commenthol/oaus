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
const debug = require('debug')('oauth2__auth-mw')
debug.error = require('debug')('oauth2__auth-mw::error')

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
      'token',
      'authorizeChain',
      'tokenChain',
      '_tokenResponse',
      '_jsonError',
      '_accessTokenCookie',
      '_authorizeResponse',
      '_authorizeError'
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
    .then((ret) => {
      console.log(ret) // TODO
      next()
    })
    .catch((err) => next(err))
  }

  authorize (req, res, next) {
    this.oauthServer.authorize(new Request(req), new Response(res))
    .then((code) => {
      res.locals = Object.assign({code}, res.locals)
      next()
    })
    .catch((err) => next(err))
  }

  /**
  * sets last login of user in database
  * requires `res.locals.locals.token.user` to be set to a valid userId of a previous
  * authentication (call `token()` first)
  */
  lastLoginAt (req, res, next) {
    const user = _get(res, 'locals.token.user')
    console.log(user)
    // return next()
    this.model.lastLoginAt(user)
    .then(() => { next && next() })
    .catch((err) => {
      debug.error('lastLoginAt %j', err)
      next && next(err)
    })
  }

  _authorizeResponse (req, res, next) {
    const {code} = res.locals
    const url = redirectUri(
      code.redirectUri,
      {code: code.code, state: _get(req, 'query.state')})
    res.redirect(url)
  }

  _authorizeError (err, req, res, next) {
    err = err || httpError(500, 'server_error')
    let url
    if (err.name === 'invalid_token' && !_get(req, 'query._login')) {
      url = redirectUri('/login', {origin: req.originalUrl})
    } else {
      debug.error('_authorizeError %j', err)
      url = redirectUri(
        _get(req, 'query.redirect_uri'),
        {error: err.name, state: _get(req, 'query.state')})
    }
    res.redirect(url)
  }

  token (req, res, next) {
    this.oauthServer.token(new Request(req), new Response(res))
    .then((token) => {
      if (!token || !token.accessToken) throw httpError(401, 'invalid_grant')
      res.locals = Object.assign({token}, res.locals)
      next()
    })
    .catch((err) => next(err))
  }

  _tokenResponse (req, res, next) {
    const {token} = res.locals
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

    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')
    res.json(_token)
  }

  _jsonError (err, req, res, next) {
    err = err || httpError(500, 'server_error')
    debug.error('_jsonError %j', err)
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
        // redirect to login
        console.log('redirect') // TODO
        res.redirect('/login')
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
function redirectUri (uri, obj) {
  uri = uri || '/'
  obj = noUndefined(obj)
  if (obj) {
    uri += '?' + qs.stringify(obj)
  }
  return uri
}
