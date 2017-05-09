/* global describe, it, before */

const assert = require('assert')
const request = require('supertest')
// const setCookie = require('set-cookie-parser')

const config = {
  database: {   // database settings
    logging: false,
    connector: 'mysql',
    url: 'mysql://dev:dev@localhost/oauth2'
  },
  csrfTokenSecret: 'NEVER CHANGE SECRETS',
  oauth2: {     // oauth2-server settings
    alwaysIssueNewRefreshToken: false, // each refresh_token grant does not write new refresh_token
    allowEmptyState: true
  },
  login: {
    clientId: 'login',
    clientSecret: 'loginsecret'
  }
}

const app = require('../example/app')(config)

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

    describe.skip('GET code grant', function () {
    })
  })

  describe.only('/authorize', function () {
    let accessToken
/*
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
*/

    accessToken = '75b885191d748ec450b97c01e8cd774e26be71aa'

    it('should authorize demo client', function () {
      return request(app)
      .get('/oauth/authorize')
      .set('cookie', 'access=' + accessToken)
      .query({
        response_type: 'code',
        client_id: 'demo',
        redirect_uri: 'http://localhost:3000/cb'
      })
      .expect(302)
      .expect('Location', /^http:\/\/localhost:3000\/cb\?code=[^&]{20,}$/)
    })

    it('should authorize demo client with optional state', function () {
      return request(app)
      .get('/oauth/authorize')
      .set('cookie', 'access=' + accessToken)
      .query({
        response_type: 'code',
        client_id: 'demo',
        redirect_uri: 'http://localhost:3000/cb',
        state: 'xyz'
      })
      .expect(302)
      .expect('Location', /^http:\/\/localhost:3000\/cb\?code=[^&]{20,}&state=xyz$/)
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
      .expect('Location', /^http:\/\/localhost:3000\/cb\?error=invalid_client&state=xyz$/)
    })

    it('should redirect to /login on invalid_token', function () {
      return request(app)
      .get('/oauth/authorize')
      .set('cookie', 'access=' + accessToken + '--invalid')
      .query({
        response_type: 'code',
        client_id: 'demo',
        redirect_uri: 'http://localhost:3000/cb',
        state: 'xyz'
      })
      .expect(302)
      .expect('Location', '/login?origin=%2Foauth%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3Ddemo%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A3000%252Fcb%26state%3Dxyz')
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
      .expect('Location', 'http://localhost:3000/cb?error=invalid_token&state=xyz')
    })
  })
})
