/**
* middleware functions for logout
*/

/* eslint camelcase: 0 */

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const _get = require('lodash.get')
const _uniqby = require('lodash.uniqby')
const request = require('superagent')
const { eachLimit } = require('asyncc')

const { LoginMw } = require('../login')
const {
  httpError
} = require('../utils')

const log = require('debug-level').log('oaus:logoutMw')

/**
  * Connect middleware functions for logout
  * @param {Object} config
  * @param {Object} config.oauth2mw - oauth2 middlewares
  * @param {String} [config.oauthPath='/oauth'] - default redirect uri to oauth2 service
  * @param {String} config.login.clientId - oauth2 clientId for login App
  * @param {String} config.login.clientSecret - oauth clientSecret
  * @param {Object} [config.login.successUri='/'] - default redirect uri after successful login
  */
function LogoutMw ({ login, oauth2, model, paths }) {
  LoginMw.call(this, { login, oauth2, model, paths })
  Object.keys(LogoutMw.prototype).forEach((p) => (this[p] = this[p].bind(this)))
}

Object.setPrototypeOf(LogoutMw.prototype, LoginMw.prototype)

Object.assign(LogoutMw.prototype, {

  /**
   * GET request which checks that user is signed-in
   */
  getChain () {
    return [
      cookieParser(),
      this._checkCookie,
      (req, res, next) => {
        req.body = { response_type: 'logout' }
        next()
      },
      this.createCsrf,
      this.render,
      this.error
    ]
  },

  /**
   * POST request from
   */
  postChain () {
    const limit = '10kb'
    return [
      cookieParser(),
      bodyParser.urlencoded({ extended: false, limit }),
      bodyParser.json({ limit }),
      this.createCsrf.bind(this),
      this.verifyCsrf.bind(this),
      this._logoutRevokeTokens.bind(this),
      this._logoutClients.bind(this),
      this.deleteCookies.bind(this),
      (req, res) => {
        // TODO use redirectUri from request - needs to be checked
        // TODO Error - redirect_uri is in req.query!
        const redirectUri = _get(req, 'body.redirect_uri') || _get(req, 'query.redirect_uri', '/')
        res.redirect(redirectUri)
      },
      this.error.bind(this)
    ]
  },

  /**
   * Revoke all tokens on logout
   * @private
   */
  _logoutRevokeTokens (req, res, next) {
    const token = LoginMw.getRefreshToken(req)
    if (token) {
      this.model.revokeAllTokens(undefined, token)
        .then((data) => {
          const { user } = data
          req.locals = { user }
          next()
        })
        .catch(() => {
          // noop
          next()
        })
    } else {
      next(httpError(401, 'invalid_request'))
    }
  },

  /**
   * logout all clients
   * @private
   * @return sets:
   * - {Object} req.locals
   */
  _logoutClients (req, res, next) {
    const { user } = req.locals
    if (user) {
      this.model.logoutClients(user)
        .then((data) => { // TODO - verify redirect_uri
          // ---- data sample ----
          // data = { user:
          //   { id: 4,
          //     username: 'user@user',
          //     scope: 'read',
          //     remember: false,
          //     logoutToken: 'fvPxLBk7HJsH2gsjAxN7DHsi4G6BIy-F' },
          //  clients:
          //   [ { clientId: 'demo',
          //       logoutURI: 'http://localhost:3000/auth/logout' } ] }
          const logoutToken = _get(data, 'user.logoutToken')
          const clients = _uniqby(_get(data, 'clients'), [], 'logoutToken')
          if (clients) {
            // fire & forget all requests
            eachLimit(5, clients,
              (client, cb) => {
                const { logoutURI } = client
                log.debug({
                  msg: 'logout@client',
                  username: user.username,
                  clientId: client.clientId,
                  logoutURI,
                  logoutToken
                })
                if (logoutURI) {
                  request
                    .post(logoutURI)
                    .timeout(10000)
                    .type('json')
                    .send({ logoutToken })
                    .end(cb)
                } else {
                  cb()
                }
              }
            )
            // we do not wait on the status of the requests we fired above...
            // lag request by 100ms
            setTimeout(() => {
              next()
            }, 100)
          } else {
            next()
          }
        })
        .catch((err) => {
          log.error(err, {ip: req.ip, fn: '_logoutClients'})
          next(err) // TODO set httpError...
        })
    } else {
      next(httpError(401, 'invalid_grant'))
    }
  },

  /**
   * check that refresh token is present as cookie
   * @private
   */
  _checkCookie (req, res, next) {
    const { refresh } = req.cookies || {}
    if (!refresh) {
      next(httpError(403, 'invalid_token'))
    } else {
      next()
    }
  }
})

module.exports = LogoutMw
