/* global describe, it, before */

const assert = require('assert')
const request = require('supertest')
const {mongodb, mysql} = require('./support/config')
// const initDb = require('./support/init-mongodb')
const appFn = require('./support/app')

const REDIRECT_URI = 'http://localhost:3000/cb'

describe('oauth2-mongodb', function () {
  let app = appFn(mongodb)
  // let app = appFn(mysql)

  before(function () {
    // return initDb().then(() => {
      // app = appFn(mongodb)
    // })
  })

  describe('POST password grant', function () {
    it('should obtain access_token', function (done) {
      request(app)
      .post('/token')
      .auth('democlient', 'democlientsecret')
      .type('form')
      .send({grant_type: 'password', username: 'admin', password: 'admin'})
      .expect((res) => {
        assert.deepEqual(Object.keys(res.body).sort(), [ 'access_token', 'expires_in', 'refresh_token' ])
      })
      .expect(200, done)
    })

    it('should get error with bad secret', function (done) {
      request(app)
      .post('/token')
      .auth('democlient', 'bad')
      .type('form')
      .send({grant_type: 'password', username: 'admin', password: 'admin'})
      .expect({
        message: 'Server error: missing client `grants`',
        code: 503,
        name: 'server_error'
      })
      .expect(500, done)
    })

    it('should get error with bad passwd', function (done) {
      request(app)
      .post('/token')
      .auth('democlient', 'democlientsecret')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin',
        password: 'bad'
      })
      .expect({
        message: 'Invalid grant: user credentials are invalid',
        code: 400,
        name: 'invalid_grant'
      })
      .expect(500, done)
    })
  })

  describe('POST refresh_token grant', function () {
    it('should obtain different tokens', function (done) {
      request(app)
      .post('/token')
      .auth('democlient', 'democlientsecret')
      .type('form')
      .send({grant_type: 'password', username: 'admin', password: 'admin'})
      .end(function (err, res) {
        assert.ok(!err, '' + err)
        assert.deepEqual(Object.keys(res.body).sort(), ['access_token', 'expires_in', 'refresh_token'])
        let old = res.body

        request(app)
        .post('/token')
        .auth('democlient', 'democlientsecret')
        .type('form')
        .send({grant_type: 'refresh_token', refresh_token: res.body.refresh_token})
        .expect((res) => {
          // console.log(res.body)
          assert.deepEqual(Object.keys(res.body).sort(), ['access_token', 'expires_in', 'refresh_token'])
          // tokens should be different
          ;['access_token', 'refresh_token'].forEach((p) => {
            assert.ok(res.body[p] !== old[p], p)
          })
        })
        .expect(200, done)
      })
    })
  })

  describe('Authorize Code', function () {
    it.only('should obtain auth code', function (done) {
      request(app)
      .get('/authorize')
      .query({response_type: 'code', client_id: 'democlient', redirect_uri: REDIRECT_URI, scope: 'demo'})
      .expect((res) => {
        console.log(JSON.stringify(res, null, 2))
      })
      .expect(200, done)
    })
  })
})
