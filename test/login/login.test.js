const assert = require('assert')
const request = require('supertest')
const {objectKeysType, /* getCsrfToken,*/ setCookieParse} = require('../support')

const config = require('../config')
const app = require('../support/app')(config)

describe('#login', function () {
  describe('initial', function () {
    it('should get rendered page', function () {
      return request(app)
        .get('/login')
        .expect(200)
        .expect((res) => {
          const {hidden} = res.body
          assert.equal(hidden.grant_type, 'password')
          assert.equal(typeof hidden.state, 'string')
        })
    })
  })

  describe('password grant', function () {
    const store = {}

    before(() => {
      return request(app)
        .get('/login')
        .then((res) => {
          const cookies = setCookieParse(res)
          store.cookie = {cookie: `state=${cookies.state.value}`}
          store.state = res.body.hidden.state
        })
    })

    it('should post form', function () {
      return request(app)
        .post('/login')
        .type('form')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: 'admin',
          state: store.state
        })
        .expect(302)
        .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
          let cookies = setCookieParse(res)
          assert.equal(res.headers.location, '/')

          assert.deepEqual(objectKeysType(cookies.access),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.access.name, path: cookies.access.path},
            {name: 'access', path: '/oauth'}
          )
          // refresh cookie shall NOT expire = session cookie
          if (cookies.refresh.expires) {
            console.error('!!! Check database oauth_users and set remember to 0 for admin@admin or run test again') // eslint-disable-line no-console
          }

          assert.deepEqual(objectKeysType(cookies.refresh),
            {name: 'String', value: 'String', path: 'String', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.refresh.name, path: cookies.refresh.path},
            {name: 'refresh', path: '/login'}
          )
        })
    })

    it('should post json', function () {
      return request(app)
        .post('/login')
        .type('json')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: 'admin',
          state: store.state
        })
        .expect(302)
        .expect((res) => {
          let cookies = setCookieParse(res)
          assert.deepEqual(objectKeysType(cookies.access),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.access.name, path: cookies.access.path},
            {name: 'access', path: '/oauth'}
          )
          // refresh cookie shall NOT expire = session cookie
          assert.deepEqual(objectKeysType(cookies.refresh),
            {name: 'String', value: 'String', path: 'String', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.refresh.name, path: cookies.refresh.path},
            {name: 'refresh', path: '/login'}
          )
        })
    })

    it('should post form with remember', function () {
      return request(app)
        .post('/login')
        .type('form')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: 'admin',
          remember: 'on',
          state: store.state
        })
        .expect(302)
        .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
          let cookies = setCookieParse(res)
          assert.equal(res.headers.location, '/')
          assert.deepEqual(objectKeysType(cookies.access),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.access.name, path: cookies.access.path},
            {name: 'access', path: '/oauth'}
          )
          // refresh cookie shall expire
          assert.deepEqual(objectKeysType(cookies.refresh),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.refresh.name, path: cookies.refresh.path},
            {name: 'refresh', path: '/login'}
          )
        })
    })

    it('should post json with remember', function () {
      return request(app)
        .post('/login')
        .type('json')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: 'admin',
          remember: 'on',
          state: store.state
        })
        .expect(302)
        .expect((res) => {
          let cookies = setCookieParse(res)
          assert.deepEqual(objectKeysType(cookies.access),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.access.name, path: cookies.access.path},
            {name: 'access', path: '/oauth'}
          )
          // refresh cookie shall expire
          assert.deepEqual(objectKeysType(cookies.refresh),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.refresh.name, path: cookies.refresh.path},
            {name: 'refresh', path: '/login'}
          )
        })
    })

    it('should post form with invalid credentials ', function () {
      return request(app)
        .post('/login')
        .type('form')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: 'ADMIN',
          state: store.state
        })
        .expect(400)
        .expect((res) => {
        // console.log(res.statusCode, res.headers, res.text)
          assert.ok(!res.headers['set-cookie'])
          const {hidden, error} = res.body
          assert.equal(error, 'invalid_grant')
          assert.equal(hidden.grant_type, 'password')
          assert.equal(typeof hidden.state, 'string')
        })
    })

    it('should post form with empty password', function () {
      return request(app)
        .post('/login')
        .type('form')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: '',
          state: store.state
        })
        .expect(400)
        .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
          assert.ok(!res.headers['set-cookie'])
          const {hidden, error} = res.body
          assert.equal(error, 'invalid_grant')
          assert.equal(hidden.grant_type, 'password')
          assert.equal(typeof hidden.state, 'string')
        })
    })

    it('should post form with bad csrf token', function () {
      return request(app)
        .post('/login')
        .type('form')
        .set(store.cookie)
        .send({
          grant_type: 'password',
          username: 'admin@admin',
          password: 'admin',
          state: store.state + 'xxx'
        })
        .expect(400)
        .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
          assert.ok(!res.headers['set-cookie'])
          const {hidden, error} = res.body
          assert.equal(error, 'bad_csrf_token')
          assert.equal(hidden.grant_type, 'password')
          assert.equal(typeof hidden.state, 'string')
        })
    })
  })

  describe('refresh_token grant', function () {
    const store = {}
    let refreshToken
    let accessToken

    before(function (done) {
      request(app)
        .get('/login')
        .then((res) => {
          const cookies = setCookieParse(res)
          store.cookie = {cookie: `state=${cookies.state.value}`}
          store.state = res.body.hidden.state

          request(app)
            .post('/login')
            .type('form')
            .set(store.cookie)
            .send({
              grant_type: 'password',
              username: 'admin@admin',
              password: 'admin',
              state: store.state
            })
            .expect((res) => {
              const cookies = setCookieParse(res)
              refreshToken = cookies.refresh.value
              accessToken = cookies.access.value
            })
            .expect(302, done)
        })
    })

    it('should request new accesstoken and redirect', function () {
      request(app)
        .get('/login')
        .set('cookie', `refresh=${refreshToken}`)
        .query({
          origin: '%2Foauth%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3Ddemo%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A3000%252Fcb%26state%3Dxyz'
        })
        .expect(302)
        .expect((res) => {
          let cookies = setCookieParse(res)
          assert.equal(res.headers.location, '/oauth/authorize?response_type=code&client_id=demo&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcb&state=xyz&_login=1')
          assert.deepEqual(objectKeysType(cookies.access),
            {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
          )
          assert.deepEqual({name: cookies.access.name, path: cookies.access.path},
            {name: 'access', path: '/oauth'}
          )
          // assertToken should be different to the previous one
          assert.ok(accessToken !== cookies.access.value)
          // with alwaysIssueNewRefreshToken=false there should not be any refresh cookie
          assert.ok(!cookies.refresh)
        })
    })
  })
})
