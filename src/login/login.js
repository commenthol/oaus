/**
* middleware functions for login
*/

const {objToArray, debug, basicAuthHeader, cookie, logRequest} = require('./utils')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const errOK200 = new Error('ok')

// alert messages
const alerts = {
  csrf: {strong: 'Caution!', text: 'CSRF token is invalid'},
  nouser: {strong: 'Oops snap!', text: 'Username or password is missing'},
  badcreds: {strong: 'Oops snap!', text: 'Wrong Email address or Password'},
  error: {strong: 'Oops sorry', text: 'Something went wrong..'}
}

// middleware chains
module.exports = {
  get: [logRequest, render],
  post: [logRequest, verify, error]
}

/**
* verify login attempt
* @param {Object} client - `{clientId: 'login', clientSecret: 'login'}` oauth2 client credentials for login app
*/
function verify (req, res, next) {
    const {body} = req
    const {username, password, csrf} = body
    const {model, csrfToken} = req._oauth2

    if (!csrfToken.verify(csrf)) {
      res.body = {alert: alerts.csrf}
      next(errOK200)
    } else if (!username || !password) {
      res.body = {alert: alerts.nouser}
      next(errOK200)
    } else {
      req.headers.authorization = basicAuthHeader(client)
      const request = new Request(req)
      const response = new Response(res)
      model.oauth.token(request, response)
      .then(function (token) {
        if (!token || !token.accessToken) throw new Error('no token found')
        console.log('###1', token, req.baseUrl, req.originalUrl)
      try{
        cookie.set(res, 'access', token.accessToken, {path: req.baseUrl || '/', expires: token.accessTokenExpiresAt, httpOnly: true}) /* , secure: true */
        if (token.refreshToken) {
          cookie.set(res, 'refresh', token.refreshToken, {path: req.originalUrl || '/', expires: token.refreshTokenExpiresAt, httpOnly: true}) /* , secure: true */
        }
        console.log('##2', res.getHeader('set-cookie'))
      } catch (e) {
        console.log(e)
      }
/*
accessToken: 'ef156c4d0b68c64040a1b3d16dcd9febd84a08eb',
accessTokenExpiresAt: 2017-04-25T15:39:32.476Z,
refreshToken: 'aa375382db0b33575aaa65751850bd05939b1791',
refreshTokenExpiresAt: 2017-05-09T14:39:32.476Z,
scope: undefined } '' '/login'
*/

        res.end()
      })
      .catch((err) => {
        debug.error('login-verify %j', err)
        res.body = res.body || {alert: alerts.error}
        if (/user credentials are invalid/.test(err.message)) {
          res.body = {alert: alerts.badcreds}
        }
        next(errOK200)
      })
    }
  }
}

function error (err, req, res, next) {
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
  const {csrfToken} = req._oauth2
  const hidden = {
    grant_type: 'password',
    csrf: csrfToken.create(),
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope
  }
  debug('hidden', hidden)
  return objToArray(hidden)
}
