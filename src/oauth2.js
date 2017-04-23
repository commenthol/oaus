/**
* middleware functions for oauth2
*/

const OAuthServer = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const models = require('./models')
const {debug, csrfToken} = require('./utils')
const _get = require('lodash.get')

module.exports = {
  connect,
  clear,
  token,
  authorize
}

/**
* @param {Object} config
* @param {String} config.csrfSecret
* @param {Object} config.database
* @param {Object} config.database.url
* @param {Object} config.database.connector
*/
function connect (config) {
  const csrf = csrfToken(config.csrfSecret)
  const {model} = models(config.database)
  const oauth = new OAuthServer({model: model})
  model.oauth = oauth

  return (req, res, next) => {
    req._model = model
    req._csrfToken = csrf
    next()
  }
}

function clear (req, res, next) {
  delete req._model
  delete req._csrfToken
  next()
}

function token (req, res) {
  const request = new Request(req)
  const response = new Response(res)

  req._model.oauth.token(request, response)
  .then(function (token) {
    const {accessToken: access_token, refreshToken: refresh_token, scope} = token
    const expires_in = Math.round((new Date(token.accessTokenExpiresAt) - new Date()) / 1000)
    const data = {access_token, refresh_token, expires_in, scope}
    debug('token', data)
    return res.json(data)
  }).catch(function (err) {
    debug.error('token %j', err)
    return res.status(500).json(err)
  })
}

function authorize (req, res) {
  const query = {
    clientId: _get(req, 'query.client_id'),
    redirectUri: _get(req, 'query.redirect_uri')
  }
  debug('authorize', query)
  req._model.findClient(query)
  .then((model) => {
    debug.error('authorize', model)
    if (!model) return res.status(404).json({ error: 'Invalid Client' })
    return res.json(model)
  }).catch(function (err) {
    debug.error('authorize %j', err)
    return res.status(err.code || 500).json(err)
  })
}
