/* global describe, it */
const assert = require('assert')
const {callBuilder, toJSON} = require('../../src/models/sqldb/storedProc')

describe('storedProc', function () {
  describe('callBuilder', function () {
    it('should build a CALL sql statement', function () {
      const res = callBuilder('table_name--read', 123, 'string', new Date(800))
      assert.strictEqual(res, "CALL table_name--read(123,'string','1970-01-01 00:00:00');")
    })
    it('should rename function name of a CALL sql statement', function () {
      const res = callBuilder('table_name%&--*read', 123, 'string', new Date(800))
      assert.strictEqual(res, "CALL table_name--read(123,'string','1970-01-01 00:00:00');")
    })
  })

  describe('toJSON', function () {
    it('should reassemble a returned query', function () {
      const res = toJSON({
        id: 123,
        'user.id': 456,
        'user.name': 'username',
        'client.id': 678,
        'client.name': 'clientname'
      })
      assert.deepEqual(res, {
        id: 123,
        user: {
          id: 456,
          name: 'username'
        },
        client: {
          id: 678,
          name: 'clientname'
        }
      })
    })
  })
})
