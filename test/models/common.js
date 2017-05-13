/* global describe, it */
const assert = require('assert')
const debug = require('debug')('test__models_common')
const {generateSignedToken, validateSignedToken} = require('../../src/models/common')

describe('common', function () {
  const secret = 'curiosity killed the cat'
  const tests = [
    {name: 'without client, user'},
    {name: 'with client, user', client: {clientId: 'demo'}, user: {username: 'memyselfandi'}}
  ]
  tests.forEach((test) => {
    describe(test.name, function () {
      let token

      it('should generate a token', function () {
        generateSignedToken(secret)(test.client, test.user)
        .then((_token) => {
          debug(_token)
          assert.equal(typeof _token, 'string')
          token = _token
        })
      })

      it('should validate a token', function () {
        validateSignedToken(secret)(token, test.client, test.user)
        .then((result) => {
          debug(result)
          assert.strictEqual(result, true)
        })
      })
    })
  })
})
