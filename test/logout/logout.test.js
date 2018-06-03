const assert = require('assert')
const request = require('superagent')
const {setCookieParse} = require('../support')
const config = require('../config')
const {promisify} = require('asyncc-promise')
const log = require('debug')('test:logout')

const app = require('../support/app')(config)
const PORT = 3000

describe('#logout', function () {
  const baseUrl = `http://localhost:${PORT}`
  const redirectUri = `http://localhost:${PORT}/auth/callback`
  const store = {}
  const agent = request.agent()

  before(function () { // login user
    return promisify(app.start)(PORT)
      .then(() => {
        return agent
          .get(`${baseUrl}/login`)
      })
      .then(res => {
        log('' + res.statusCode, res.headers, res.body)
        const cookies = setCookieParse(res)
        Object.assign(store, {
          cookie: `state=${cookies.state.value}`,
          state: res.body.hidden.state
        })
        log(store)
      })
      .then(() => {
        return agent
          .post(`${baseUrl}/login`)
          .type('form')
          .redirects(0)
          .withCredentials()
          .send({
            grant_type: 'password',
            username: 'user@user',
            password: 'user',
            state: store.state
          })
          .catch(err => {
            const res = err.response
            assert.equal(res.statusCode, 302)
          })
      })
  })

  after((done) => {
    app.close(done)
  })

  it('should authorize a client', function () {
    return agent
      .get(`${baseUrl}/oauth/authorize`)
      .query({
        response_type: 'code',
        client_id: 'demo',
        redirect_uri: redirectUri
      })
      .withCredentials()
      .then(res => {
        assert.equal(res.statusCode, 200)
      })
  })

  it('should get redirect to /login/logout', function () {
    return agent
      .get(`${baseUrl}/oauth/authorize`)
      .redirects(0)
      .query({
        response_type: 'logout',
        client_id: 'demo',
        redirect_uri: redirectUri
      })
      .withCredentials()
      .catch(err => { // 302 is an error for superagent!!!
        assert.equal(err.status, 302)
        assert.equal(err.response.headers.location, '/login/logout?response_type=logout&client_id=demo&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback')
      })
  })

  it('should start logout by getting a csrf state', function () {
    return agent
      .get(`${baseUrl}/login/logout`)
      .query({
        response_type: 'logout',
        client_id: 'demo',
        redirect_uri: redirectUri
      })
      .withCredentials()
      .then((res) => {
        log(res.statusCode, res.headers, res.body)
        const body = res.body
        assert.equal(typeof body.hidden, 'object')
        assert.equal(typeof body.hidden.state, 'string')
        assert.equal(body.hidden.response_type, 'logout')
        store.state = body.hidden.state
        log(store)
      })
  })

  it('should post logout + state', function () {
    assert.ok(store.state, 'need store.state from previous test')
    return agent
      .post(`${baseUrl}/login/logout`)
      .redirects(0)
      .type('form')
      .send({
        response_type: 'logout',
        client_id: 'demo',
        redirect_uri: redirectUri,
        state: store.state
      })
      .catch(err => { // 302 is an error for superagent!!!
        const res = err.response
        log(res.statusCode, res.headers)
        assert.equal(res.statusCode, 302) // <fails here
        assert.equal(res.headers.location, redirectUri)
        assert.deepEqual(res.headers['set-cookie'], [
          'access=; Max-Age=0; Path=/oauth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
          'refresh=; Max-Age=0; Path=/login; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly'
        ])
      })
  })

  it('app should have send client logout request', function () {
    return agent
      .get(`${baseUrl}/auth/test/logoutToken`)
      .then(res => {
        assert.equal(res.body.count, 1)
        assert.equal(typeof res.body.logoutToken, 'string')
      })
  })
})
