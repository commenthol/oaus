/**
* oauth2 connect middlewares
*/

const OAuthServer = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const httpError = require('http-errors')
const models = require('../models')

/**
* connects to database server
* @param {object} config
* @param {object} config.database - database config @see src/models/index.js
* @param {object} config.oauth2 - @see node_modules/oauth2-server/lib/server.js
*/
class oauth2Mw {
  constructor (config) {
    const {model} = models(config.database)
    const oauthServer = new OAuthServer({model: model})
    this.config = config
    this.oauthServer = oauthServer
    this.model = model // database model methods

    this.authenticate = this.authenticate.bind(this)
    this.authorize = this.authorize.bind(this)
    this.token = this.token.bind(this)
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
    .then((ret) => {
      console.log(ret) // TODO
      next()
    })
    .catch((err) => next(err))
  }

  token (req, res, next) {
    this.oauthServer.token(new Request(req), new Response(res))
    .then((token) => {
      if (!token || !token.accessToken) throw httpError(500, 'no access token found')
      res.locals = Object.assign({token}, res.locals)
      next()
    })
    .catch((err) => next(err))
  }
}

module.exports = oauth2Mw
