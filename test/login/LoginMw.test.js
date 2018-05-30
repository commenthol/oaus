/* globals describe, it */
/*
const assert = require('assert')
const request = require('supertest')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const {setCookieParse} = require('../support')
const config = require('../config')

const oaus = require('../..')

describe.skip('#LoginMw', function () {

config.oauth2mw = new oaus.OAuth2Mw(config)

const {LoginMw} = oaus.login
const mws = new LoginMw(config)

const render = (req, res) => {
  res.json(res.body)
}
const error = (err, req, res, next) => {
  // console.log(err)
  res.statusCode = err.status || 500
  render(req, res)
}

const app = require('express')()
app.get('/login',
  cookieParser(),
  mws.createCsrf,
  mws.render,
  render)
app.post('/login',
  cookieParser(),
  bodyParser.json(),
  mws.createCsrf,
  mws.verifyCsrf,
  mws.render,
  render)
app.use(mws.error,
  error)

  const agent = request.agent(app)
  const store = {}

  it('should set CSRF Secret and token', function () {
    return agent
      .get('/login')
      .expect((res) => {
        const cookies = setCookieParse(res)
        // has a "state" session cookie
        assert.ok(cookies.state)
        assert.equal(typeof cookies.state.value, 'string')
        assert.equal(cookies.state.path, '/login')
        // is session cookie
        assert.ok(!cookies.state.expires)
        // csrf token differs from secret
        assert.equal(typeof res.body.hidden.state, 'string')
        assert.notEqual(cookies.state.value, res.body.hidden.state)

        store.state = res.body.hidden.state
      })
      .expect(200)
  })

  it('should verify CSRF Secret and token', function () {
    assert.ok(store.state, 'needs state from previous test')
    return agent
      .post('/login')
      .send({state: store.state})
      .expect((res) => {
        const cookies = setCookieParse(res)
        // should not send csrf secret again
        assert.ok(!cookies.state)
        // should send state token in body
        assert.equal(typeof res.body.hidden.state, 'string')
      })
      .expect(200)
  })

  it('should verify with error if token is not present', function () {
    assert.ok(store.state, 'needs state from previous test')
    return agent
      .post('/login')
      .send({})
      .expect((res) => {
        assert.ok(res.body)
        assert.equal(res.body.error, 'bad_csrf_token')
        const cookies = setCookieParse(res)
        // should not send csrf secret again
        assert.ok(!cookies.state)
        // should send state token in body
        assert.equal(typeof res.body.hidden.state, 'string')
      })
      .expect(400)
  })

  it('should verify with error if token is wrong', function () {
    assert.ok(store.state, 'needs state from previous test')
    return agent
      .post('/login')
      .send({state: 'fakeisfakeisfake'})
      .expect((res) => {
        assert.ok(res.body)
        assert.equal(res.body.error, 'bad_csrf_token')
        const cookies = setCookieParse(res)
        // should not send csrf secret again
        assert.ok(!cookies.state)
        // should send state token in body
        assert.equal(typeof res.body.hidden.state, 'string')
      })
      .expect(400)
  })

  it('should verify with error if secret is wrong', function () {
    assert.ok(store.state, 'needs state from previous test')
    return agent
      .post('/login')
      .set({cookie: 'state=fakeisfakeisfake'})
      .send({state: store.state})
      .expect((res) => {
        assert.ok(res.body)
        assert.equal(res.body.error, 'bad_csrf_token')
        const cookies = setCookieParse(res)
        // should send csrf secret again
        assert.ok(cookies.state)
        // should send state token in body
        assert.equal(typeof res.body.hidden.state, 'string')
      })
      .expect(400)
  })

  it('should verify with error if secret is missing', function () {
    assert.ok(store.state, 'needs state from previous test')
    return request(app)
      .post('/login')
      .send({state: store.state})
      .expect((res) => {
        assert.ok(res.body)
        assert.equal(res.body.error, 'bad_csrf_token')
        const cookies = setCookieParse(res)
        // should send csrf secret again
        assert.ok(cookies.state)
        // should send state token in body
        assert.equal(typeof res.body.hidden.state, 'string')
      })
      .expect(400)
  })
})
*/
