/* global describe, it, before */

const assert = require('assert')
const request = require('supertest')
const qs = require('querystring')
const url = require('url')

const config = require('../config')
const app = require('../support/app')(config)

describe('#oauth', function () {
  describe('/token', function () {
    describe('POST password grant', function () {
      it('should obtain access_token', function () {
        return request(app)
          .post('/oauth/token')
          .auth('login', 'loginsecret')
          .type('form')
          .send({
            grant_type: 'password',
            username: 'admin@admin',
            password: 'admin'
          })
          .expect(200)
          .expect((res) => {
            assert.deepEqual(Object.keys(res.body).sort(),
              ['access_token', 'expires_in', 'refresh_token', 'token_type']
            )
          })
      })

      it('should get error with bad secret', function () {
        return request(app)
          .post('/oauth/token')
          .auth('login', 'BAD')
          .type('form')
          .send({
            grant_type: 'password',
            username: 'admin@admin',
            password: 'admin'
          })
          .expect(401)
          .expect({
            error: 'invalid_client'
          })
      })

      it('should get error with bad passwd', function () {
        return request(app)
          .post('/oauth/token')
          .auth('login', 'loginsecret')
          .type('form')
          .send({
            grant_type: 'password',
            username: 'admin@admin',
            password: 'bad'
          })
          .expect(400)
          .expect({
            error: 'invalid_grant'
          })
      })
    })

    describe('POST client_credentials grant', function () {
      it('should obtain access_token', function () {
        return request(app)
          .post('/oauth/token')
          .auth('demo', 'demosecret')
          .type('form')
          .send({
            grant_type: 'client_credentials'
          })
          .expect(200)
          .expect((res) => {
            assert.deepEqual(Object.keys(res.body).sort(),
              ['access_token', 'expires_in', 'token_type']
            )
          })
      })

      it('should get error with bad secret', function () {
        return request(app)
          .post('/oauth/token')
          .auth('demo', 'BAD')
          .type('form')
          .send({
            grant_type: 'client_credentials'
          })
          .expect(401)
          .expect({
            error: 'invalid_client'
          })
      })
    })

    describe('POST refresh_token grant', function () {
      let previous

      before(function (done) {
        request(app)
          .post('/oauth/token')
          .auth('demo', 'demosecret')
          .type('form')
          .send({
            grant_type: 'password', username: 'admin@admin', password: 'admin'
          })
          .end(function (err, res) {
            assert.ok(!err, '' + err)
            assert.deepEqual(
              Object.keys(res.body).sort(),
              ['access_token', 'expires_in', 'refresh_token', 'token_type']
            )
            previous = res.body
            done()
          })
      })

      it('should obtain different tokens', function () {
        return request(app)
          .post('/oauth/token')
          .auth('demo', 'demosecret')
          .type('form')
          .send({
            grant_type: 'refresh_token', refresh_token: previous.refresh_token
          })
          .expect(200)
          .expect((res) => {
            assert.deepEqual(
              Object.keys(res.body).sort(),
              ['access_token', 'expires_in', 'token_type']
            )
            // token should be different
            ;['access_token'].forEach((p) => {
              assert.ok(res.body[p] !== previous[p], p)
            })
          })
      })
    })
  })

  describe('/authorize', function () {
    let accessToken
    let authorizationCode

    before(function (done) {
      request(app)
        .post('/oauth/token')
        .auth('login', 'loginsecret')
        .type('form')
        .send({
          grant_type: 'password',
          username: 'user@user',
          password: 'user'
        })
        .expect(200)
        .end((err, res) => {
          assert.ok(!err, '' + err)
          accessToken = res.body.access_token
          done()
        })
    })

    it('should authorize demo client', function () {
      return request(app)
        .get('/oauth/authorize')
        .set('cookie', 'access=' + accessToken)
        .query({
          response_type: 'code',
          client_id: 'demo',
          redirect_uri: 'http://localhost:3000/auth/callback'
        })
        .expect(302)
        .expect('Location', /^http:\/\/localhost:3000\/auth\/callback\?code=[^&]{20,}$/)
        .expect((res) => {
          let u = url.parse(res.headers.location)
          let q = qs.parse(u.query)
          authorizationCode = q.code
        })
    })

    it('should authorize demo client with optional state', function () {
      return request(app)
        .get('/oauth/authorize')
        .set('cookie', 'access=' + accessToken)
        .query({
          response_type: 'code',
          client_id: 'demo',
          redirect_uri: 'http://localhost:3000/auth/callback',
          state: 'xyz'
        })
        .expect(302)
        .expect('Location', /^http:\/\/localhost:3000\/auth\/callback\?code=[^&]{20,}&state=xyz$/)
    })

    it('should return invalid_client', function () {
      return request(app)
        .get('/oauth/authorize')
        .set('cookie', 'access=' + accessToken)
        .query({
          response_type: 'code',
          client_id: 'demoxx',
          redirect_uri: 'http://localhost:3000/cb',
          state: 'xyz'
        })
        .expect(302)
        .expect('Location', 'http://localhost:3000/cb?error=invalid_client&state=xyz&error_description=Invalid%20client%3A%20client%20credentials%20are%20invalid')
    })

    it('should redirect to /login on invalid_token', function () {
      return request(app)
        .get('/oauth/authorize')
        .set('cookie', 'access=' + accessToken + '--invalid')
        .query({
          response_type: 'code',
          client_id: 'demo',
          redirect_uri: 'http://localhost:3000/auth/callback',
          state: 'xyz'
        })
        .expect(302)
        .expect('Location', '/login?origin=%2Foauth%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3Ddemo%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A3000%252Fauth%252Fcallback%26state%3Dxyz')
    })

    it('should redirect with error invalid_token', function () {
      return request(app)
        .get('/oauth/authorize')
        .set('cookie', 'access=' + accessToken + '--invalid')
        .query({
          response_type: 'code',
          client_id: 'demo',
          redirect_uri: 'http://localhost:3000/cb',
          state: 'xyz',
          _login: 1
        })
        .expect(302)
        .expect('Location', 'http://localhost:3000/cb?error=invalid_token&state=xyz&error_description=Invalid%20token%3A%20access%20token%20is%20invalid')
    })

    describe('POST /token authorization_code grant', function () {
      it('should obtain access_token', function () {
        return request(app)
          .post('/oauth/token')
          .auth('demo', 'demosecret')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: 'http://localhost:3000/auth/callback'
          })
          .expect(200)
          .expect((res) => {
            assert.deepEqual(Object.keys(res.body).sort(),
              ['access_token', 'expires_in', 'refresh_token', 'token_type']
            )
          })
      })

      it('should get error with bad authorizationCode', function () {
        return request(app)
          .post('/oauth/token')
          .auth('demo', 'demosecret')
          .type('form')
          .send({
            grant_type: 'authorization_code',
            code: authorizationCode + '--invalid',
            redirect_uri: 'http://localhost:3000/cb'
          })
          .expect(400)
          .expect({
            error: 'invalid_grant'
          })
      })
    })
  })

  describe('authenticate', function () {
    let accessToken

    before(function (done) {
      request(app)
        .post('/oauth/token')
        .auth('login', 'loginsecret')
        .type('form')
        .send({
          grant_type: 'password',
          username: 'user@user',
          password: 'user'
        })
        .expect(200)
        .end((err, res) => {
          assert.ok(!err, '' + err)
          accessToken = res.body.access_token
          done()
        })
    })

    it('should access private area with valid access token', function () {
      return request(app)
        .get('/resource/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body
          assert.equal(typeof body.logoutToken, 'string')
          delete body.logoutToken
          assert.deepEqual(body, { username: 'user@user', scope: 'undefined' })
        })
    })
  })
})
