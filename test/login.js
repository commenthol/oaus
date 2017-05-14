/* globals describe, it, before */

const assert = require('assert')
const request = require('supertest')
const setCookie = require('set-cookie-parser')
const cheerio = require('cheerio')

const {utils} = require('..')
const {objectKeysType} = require('./helper')

const config = require('./config')
const app = require('../example/app')(config)

describe('#login', function () {
  it('should get rendered page', function (done) {
    request(app)
    .get('/login')
    .expect((res) => {
      let inp = inputElems(res)
      assert.deepEqual(inp.grant_type, { type: 'hidden', name: 'grant_type', value: 'password' })
      assert.equal(inp.csrf.type, 'hidden')
    })
    .expect(200, done)
  })

  describe('password grant', function () {
    it('should post', function (done) {
      request(app)
      .post('/login')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin@admin',
        password: 'admin',
        csrf: getCsrfToken()
      })
      .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
        let cookies = {}
        setCookie.parse(res).forEach((p) => {
          cookies[p.name] = p
        })
        assert.equal(res.headers.location, '/')
        assert.deepEqual(objectKeysType(cookies.access),
          {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
        )
        assert.deepEqual({name: cookies.access.name, path: cookies.access.path},
          {name: 'access', path: '/oauth'}
        )
        assert.deepEqual(objectKeysType(cookies.refresh),
          {name: 'String', value: 'String', path: 'String', httpOnly: 'Boolean'}
        )
        assert.deepEqual({name: cookies.refresh.name, path: cookies.refresh.path},
          {name: 'refresh', path: '/login'}
        )
      })
      .expect(302, done)
    })

    it('should post with remember and set refresh cookie not as session cookie', function (done) {
      request(app)
      .post('/login')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin@admin',
        password: 'admin',
        remember: 'on',
        csrf: getCsrfToken()
      })
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
        assert.deepEqual(objectKeysType(cookies.refresh),
          {name: 'String', value: 'String', path: 'String', expires: 'Date', httpOnly: 'Boolean'}
        )
        assert.deepEqual({name: cookies.refresh.name, path: cookies.refresh.path},
          {name: 'refresh', path: '/login'}
        )
      })
      .expect(302, done)
    })

    it('should render page with alert and not set cookie on invalid credentials ', function (done) {
      request(app)
      .post('/login')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin@admin',
        password: 'ADMIN',
        csrf: getCsrfToken()
      })
      .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
        assert.ok(!res.headers['set-cookie'])
        assert.equal(alertElem(res), 'Oops snap! Wrong Email address or Password. Please resubmit.')
      })
      .expect(400, done)
    })

    it('should render page with alert and not set cookie on empty password', function (done) {
      request(app)
      .post('/login')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin@admin',
        password: '',
        csrf: getCsrfToken()
      })
      .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
        assert.ok(!res.headers['set-cookie'])
        assert.equal(alertElem(res), 'Oops snap! Wrong Email address or Password. Please resubmit.')
      })
      .expect(400, done)
    })

    it('should render page with alert and not set cookie on bad csrf token', function (done) {
      request(app)
      .post('/login')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin@admin',
        password: 'admin',
        csrf: getCsrfToken() + 'xxx'
      })
      .expect((res) => {
        // console.log(res.statusCode, res.headers, res.body)
        assert.ok(!res.headers['set-cookie'])
        assert.equal(alertElem(res), 'The CSRF token is invalid! Please try to resubmit the form')
      })
      .expect(400, done)
    })
  })

  describe('refresh_token grant', function () {
    let refreshToken
    let accessToken

    before(function (done) {
      // done()
      // return
      request(app)
      .post('/login')
      .type('form')
      .send({
        grant_type: 'password',
        username: 'admin@admin',
        password: 'admin',
        csrf: getCsrfToken()
      })
      .expect((res) => {
        const cookies = setCookieParse(res)
        refreshToken = cookies.refresh.value
        accessToken = cookies.access.value
      })
      .expect(302, done)
    })

    it('should request new accesstoken and redirect', function (done) {
      request(app)
      .get('/login')
      .set('cookie', `refresh=${refreshToken}`)
      .query({
        origin: '%2Foauth%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3Ddemo%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A3000%252Fcb%26state%3Dxyz'
      })
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
      .expect(302, done)
    })
  })
})

function getCsrfToken () {
  return utils.csrfToken(config.csrfTokenSecret).create()
}

function setCookieParse (res) {
  let cookies = {}
  setCookie.parse(res).forEach((p) => {
    cookies[p.name] = p
  })
  return cookies
}

function inputElems (res) {
  const $ = cheerio.load(res.text)
  let inp = {}
  $('input').map((i, e) => {
    let el = $(e).attr()
    inp[el.name] = el
  })
  return inp
}

function alertElem (res) {
  const $ = cheerio.load(res.text)
  return $('.alert').text().trim()
}
