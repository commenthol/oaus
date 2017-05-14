/* global describe, it */
const assert = require('assert')
const debug = require('debug')('test__models_common')
const {signedToken} = require('..').utils

describe('utils', function () {
  describe('signedToken', function () {
    const secret = 'curiosity killed the cat'
    const tests = [
      {name: 'without client, user'},
      {name: 'with client, user', client: {clientId: 'demo'}, user: {username: 'memyselfandi'}}
    ]
    tests.forEach((test) => {
      describe(test.name, function () {
        it('should generate a token', function () {
          return signedToken(secret).generate(test)
          .then((tokenVal) => {
            debug(tokenVal)
            assert.equal(typeof tokenVal, 'string')
            test.tokenVal = tokenVal
          })
        })

        it('should validate a token', function () {
          return signedToken(secret).validate(test.tokenVal, test)
          .then((token) => {
            debug(token)
            assert.strictEqual(!!token, true)
            assert.strictEqual(typeof token, 'string')
          })
        })
      })
    })
  })
})
