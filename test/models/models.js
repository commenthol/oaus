/* global describe, it, before, after */
const assert = require('assert')
const _ = require('lodash')
const {
  accessToken,
  refreshToken,
  authorizationCode,
  getUserClient,
  timeout
} = require('./helper')
const {
  objectKeysType
} = require('../helper')

const models = require('../../src/models')

const config = {
  mongodb: {
    connector: 'mongodb',
    url: 'mongodb://localhost/oauth2'
  },
  mysql: {
    connector: 'mysql',
    url: 'mysql://dev:dev@localhost/oauth2',
    logging: false,
    storedProcedures: true
  }
}

// definition of test constants
const users = {
  admin: {username: 'admin@admin', password: 'admin'},
  user: {username: 'user@user', password: 'user'}
}
const clients = {
  demo: {name: 'demoName', clientId: 'demo', clientSecret: 'demosecret'},
  login: {name: 'loginName', clientId: 'login', clientSecret: 'loginsecret'},
  client: {name: 'clientName', clientId: 'client', clientSecret: undefined}
}

function timer () {
  let start = Date.now()
  return function (name) {
    let end = Date.now()
    console.log('>>timer(ms)', name, end - start)
    start = end
  }
}

// tests
describe('#models', function () {
  [
    { name: 'mongodb connector',
      config: _.merge({}, config.mongodb),
      type: 'mongo'
    },
    { name: 'mysql connector with storedProcedures',
      config: _.merge({}, config.mysql, {storedProcedures: true})
    },
    { name: 'mysql connector',
      config: _.merge({}, config.mysql, {storedProcedures: false})
    }
  ].forEach((test) => {
    let config = test.config

    describe(test.name, function () {
      const {model} = models(config)
      let t

      before(() => {
        t = timer()
      })

      after(() => {
        t(test.name)
      })

      describe('getUser', function () {
        it('should return user', function () {
          const {username, password} = users.user
          return model.getUser(username, password)
          .then((user) => {
            assert.strictEqual(user.username, username)
          })
        })
        it('should run with unknown user', function () {
          const {username, password} = users.user
          return model.getUser(username + '###', password)
          .then((user) => {
            assert.strictEqual(user, null)
          })
        })
      })

      describe('getClient', function () {
        it('should return client', function () {
          const {clientId, clientSecret} = clients.demo
          return model.getClient(clientId, clientSecret)
          .then((client) => {
            assert.deepEqual(Object.keys(_.omit(client, ['id', '_id'])).sort(), [
              'accessTokenLifetime',
              'clientId',
              'clientSecret',
              'createdAt',
              'grants',
              'name',
              'redirectUris',
              'refreshTokenLifetime',
              'scope',
              'updatedAt',
              'userId'
            ])
            assert.strictEqual(client.name, 'demoName')
            assert.strictEqual(client.clientId, 'demo')
            assert.deepEqual(client.grants, ['authorization_code', 'password', 'refresh_token', 'client_credentials'])
            assert.deepEqual(client.redirectUris, ['http://localhost:3000/cb', 'http://localhost:3000/cb1'])
          })
        })

        it('should get client without secret', function () {
          const {clientId, clientSecret} = clients.client
          return model.getClient(clientId, clientSecret)
          .then((client) => {
            // console.log(client)
            assert.strictEqual(client.name, 'clientName')
            assert.strictEqual(client.clientId, 'client')
            assert.deepEqual(client.grants, ['authorization_code', 'password', 'refresh_token', 'client_credentials'])
            assert.deepEqual(client.redirectUris, ['/cb2'])
          })
        })

        it('should run on invalid clientId', function () {
          const {clientId, clientSecret} = clients.client
          return model.getClient(clientId + '###', clientSecret)
          .then((client) => {
            assert.strictEqual(client, null)
          })
        })

        it('should not return client if secret is wrong', function () {
          const {clientId} = clients.demo
          return model.getClient(clientId, 'demoSecret')
          .then((client) => {
            assert.strictEqual(client, null)
          })
        })
      })

      describe('saveToken', function () {
        let user
        let client

        before(function () {
          return getUserClient(model, users.user, clients.demo).then((res) => {
            user = res[0]
            client = res[1]
          })
        })

        it('should save access token', function () {
          const atValue = 'at' + Date.now()
          const token = accessToken(atValue, 60)
          return model.saveToken(token, client, user)
          .then((res) => {
            if (test.type === 'mongo') {
              assert.deepEqual(objectKeysType(res), {
                client: {
                  _id: { _bsontype: 'String', id: 'Uint8Array' },
                  name: 'String',
                  clientId: 'String',
                  clientSecret: 'String',
                  refreshTokenLifetime: 'Null',
                  accessTokenLifetime: 'Null',
                  scope: 'String',
                  grants: [ 'String', 'String', 'String', 'String' ],
                  redirectUris: [ 'String', 'String' ],
                  createdAt: 'Date',
                  updatedAt: 'Date',
                  userId: {_bsontype: 'String', id: 'Uint8Array'}
                },
                user: {
                  _id: { _bsontype: 'String', id: 'Uint8Array' },
                  username: 'String',
                  scope: 'String',
                  lastSignInAt: 'Date',
                  lastSignOutAt: 'Date',
                  createdAt: 'Date',
                  updatedAt: 'Date'
                },
                accessToken: 'String',
                accessTokenExpiresAt: 'Date',
                scope: 'Null'
              })
            } else {
              assert.deepEqual(objectKeysType(res), {
                client: {
                  id: 'Number',
                  name: 'String',
                  clientId: 'String',
                  clientSecret: 'String',
                  grants: [ 'String', 'String', 'String', 'String' ],
                  refreshTokenLifetime: 'Null',
                  accessTokenLifetime: 'Null',
                  scope: 'String',
                  createdAt: 'Date',
                  updatedAt: 'Date',
                  userId: 'Number',
                  redirectUris: [ 'String', 'String' ]
                },
                user: {
                  id: 'Number',
                  username: 'String',
                  password: 'String',
                  scope: 'String'
                },
                accessToken: 'String',
                accessTokenExpiresAt: 'Date',
                scope: 'Null'
              })
            }
            assert.equal(res.accessToken, token.accessToken)
            assert.equal(res.accessTokenExpiresAt, token.accessTokenExpiresAt)
          })
        })

        it('should throw on saving same access token', function () {
          const atValue = 'at' + Date.now()
          const token = accessToken(atValue, 60)
          return model.saveToken(token, client, user)
          .then(() => {
            return model.saveToken(token, client, user)
          })
          .catch((err) => {
            assert.equal(err.message, 'Validation error')
          })
        })

        it('should save refresh token', function () {
          const atValue = 'at' + Date.now()
          const token = accessToken(atValue, 60)
          const rtValue = 'rt' + Date.now()
          Object.assign(token, refreshToken(rtValue, 60))
          return model.saveToken(token, client, user)
          .then((res) => {
            assert.equal(res.accessToken, token.accessToken)
            assert.equal(res.accessTokenExpiresAt, token.accessTokenExpiresAt)
            assert.equal(res.refreshToken, token.refreshToken)
            assert.equal(res.refreshTokenExpiresAt, token.refreshTokenExpiresAt)
          })
        })
      })

      describe('getAccessToken', function () {
        let user
        let client
        let token

        before(function () {
          return getUserClient(model, users.user, clients.demo)
          .then((res) => {
            user = res[0]
            client = res[1]
          }).then(() => {
            const atValue = 'at' + Date.now()
            token = accessToken(atValue, 60)
            return model.saveToken(token, client, user)
          })
        })

        it('should get access token', function () {
          return model.getAccessToken(token.accessToken)
          .then((res) => {
            assert.deepEqual(
              _.pick(res.client, ['clientId', 'scope']), {
                clientId: 'demo',
                scope: 'read write'
              }
            )
            assert.deepEqual(
              _.pick(res.user, ['username', 'scope']), {
                username: 'user@user',
                scope: 'read'
              }
            )
            assert.equal(res.accessToken, token.accessToken)
            if (test.type !== 'mongo') {
              token.accessTokenExpiresAt.setMilliseconds(0)
            }
            assert.equal(res.accessTokenExpiresAt.toISOString(), token.accessTokenExpiresAt.toISOString())
          })
        })

        it('should not get access token', function () {
          return model.getAccessToken('token.accessToken')
          .then((res) => {
            assert.equal(res, null)
          })
        })
      })

      describe('getRefreshToken', function () {
        let user
        let client
        let token

        before(function () {
          return getUserClient(model, users.user, clients.demo)
          .then((res) => {
            user = res[0]
            client = res[1]
          }).then(() => {
            const atValue = 'at' + Date.now()
            token = accessToken(atValue, 60)
            const rtValue = 'rt' + Date.now()
            Object.assign(token, refreshToken(rtValue, 60))
            return model.saveToken(token, client, user)
          })
        })

        it('should get refresh token', function () {
          return model.getRefreshToken(token.refreshToken)
          .then((res) => {
            assert.deepEqual(
              _.pick(res.client, ['clientId', 'scope']), {
                clientId: 'demo',
                scope: 'read write'
              }
            )
            assert.deepEqual(
              _.pick(res.user, ['username', 'scope']), {
                username: 'user@user',
                scope: 'read'
              }
            )
            assert.equal(res.refreshToken, token.refreshToken)
            if (test.type !== 'mongo') {
              token.refreshTokenExpiresAt.setMilliseconds(0)
            }
            assert.equal(res.refreshTokenExpiresAt.toISOString(), token.refreshTokenExpiresAt.toISOString())
          })
        })

        it('should not get refresh token', function () {
          return model.getRefreshToken('token.refreshToken')
          .then((res) => {
            assert.equal(res, null)
          })
        })
      })

      describe('saveAuthorizationCode', function () {
        let user
        let client

        before(function () {
          return getUserClient(model, users.admin, clients.demo).then((res) => {
            user = res[0]
            client = res[1]
          })
        })

        it('should save auth code', function () {
          const value = 'ac' + Date.now()
          const code = authorizationCode(value, 60, '/cb')
          return model.saveAuthorizationCode(code, client, user)
          .then((res) => {
            assert.deepEqual(objectKeysType(res), {
              authorizationCode: 'String',
              expiresAt: 'Date',
              redirectUri: 'String',
              scope: 'Null',
              code: 'String'
            })
            assert.equal(res.authorizationCode, code.authorizationCode)
            if (test.type !== 'mocha') {
              code.expiresAt.setMilliseconds(0)
            }
            assert.equal(res.expiresAt, code.expiresAt)
            assert.equal(res.redirectUri, code.redirectUri)
          })
        })
      })

      describe('getAuthorizationCode', function () {
        let user
        let client
        let code

        before(function () {
          return getUserClient(model, users.user, clients.demo)
          .then((res) => {
            user = res[0]
            client = res[1]
            const value = 'ac' + Date.now()
            code = authorizationCode(value, 60, '/cb')
            return model.saveAuthorizationCode(code, client, user)
          })
        })

        it('should get auth code', function () {
          return model.getAuthorizationCode(code.authorizationCode)
          .then((res) => {
            assert.deepEqual(
              _.pick(res.client, ['clientId', 'scope']), {
                clientId: 'demo',
                scope: 'read write'
              }
            )
            assert.deepEqual(
              _.pick(res.user, ['username', 'scope']), {
                username: 'user@user',
                scope: 'read'
              }
            )
            assert.equal(res.authorizationCode, code.authorizationCode)
            if (test.type !== 'mongo') {
              code.expiresAt.setMilliseconds(0)
            }
            assert.equal(res.expiresAt.toISOString(), code.expiresAt.toISOString())
            assert.equal(res.redirectUri, code.redirectUri)
            assert.deepEqual(_.pick(res.user, ['username', 'scope']), { username: 'user@user', scope: 'read' })
            assert.deepEqual(_.pick(res.client, ['clientId', 'scope']), { clientId: 'demo', scope: 'read write' })
          })
        })

        it('should not get auth code', function () {
          return model.getAuthorizationCode('code.authorizationCode')
          .then((res) => {
            assert.equal(res, null)
          })
        })
      })

      describe('getUserFromClient', function () {
        it('should get user from client', function () {
          return model.getUserFromClient(clients.demo)
          .then((res) => {
            if (test.type === 'mongo') {
              assert.deepEqual(objectKeysType(res), {
                _id: { _bsontype: 'String', id: 'Uint8Array' },
                username: 'String',
                scope: 'Null',
                lastSignInAt: 'Date',
                lastSignOutAt: 'Date',
                createdAt: 'Date',
                updatedAt: 'Date'
              })
            } else {
              assert.deepEqual(objectKeysType(res), {
                id: 'Number',
                username: 'String',
                scope: 'Null',
                createdAt: 'Date',
                updatedAt: 'Date'
              })
            }
            assert.strictEqual(res.username, 'admin@admin')
          })
        })

        it('should get user from client without secret', function () {
          return model.getUserFromClient(clients.client)
          .then((res) => {
            assert.strictEqual(res.username, 'admin@admin')
          })
        })

        it('should not get user from not existing client', function () {
          return model.getUserFromClient('clients.client')
          .then((res) => {
            assert.strictEqual(res, null)
          })
        })
      })

      describe('lastSignInAt', function () {
        let gUser
        before(() => {
          const {username, password} = users.user
          return model.getUser(username, password)
          .then((user) => {
            assert.strictEqual(user.username, username)
            gUser = user
          })
        })

        it('should set last login date in database', function () {
          return model.lastSignInAt(gUser)
          .then((res) => {
            console.log(res)
          })
          .catch((err) => {
            console.log(err)
            assert.ok(false)
          })
        })
      })

      describe('revokeToken', function () {
        let token

        before(function () {
          return getUserClient(model, users.user, clients.demo).then((res) => {
            const user = res[0]
            const client = res[1]
            const value = 'revoke' + Date.now()
            token = accessToken(value, 60)
            Object.assign(token, refreshToken(value, 60))
            return model.saveToken(token, client, user)
          })
        })

        it('should delete refreshToken', function () {
          return model.revokeToken(token)
          .then(() => {
            return timeout(10)
          })
          .then(() => {
            return model.getRefreshToken(token.refreshToken)
          })
          .then((res) => {
            assert.equal(res, null)
          })
        })
      })

      describe('revokeAuthorizationCode', function () {
        let code

        before(function () {
          return getUserClient(model, users.user, clients.demo).then((res) => {
            const user = res[0]
            const client = res[1]
            const value = 'revoke' + Date.now()
            code = authorizationCode(value, 60, '/cb')
            return model.saveAuthorizationCode(code, client, user)
          })
        })

        it('should delete authorizationCode', function () {
          return model.revokeAuthorizationCode(code)
          .then(() => {
            return timeout(10)
          })
          .then(() => {
            return model.getAuthorizationCode(code.authorizationCode)
          })
          .then((res) => {
            assert.equal(res, null)
          })
        })
      })

      describe('revokeAllTokens', function () {
        let token
        let user

        before(function () {
          return getUserClient(model, users.user, clients.demo).then((res) => {
            user = res[0]
            const client = res[1]
            const value = 'revokeAll' + Date.now()
            token = accessToken(value, 60)
            Object.assign(token, refreshToken(value, 60))
            const code = authorizationCode(value, 60, '/cb')
            return Promise.all([
              model.saveAuthorizationCode(code, client, user),
              model.saveToken(token, client, user)
            ]).then(() => {
              return timeout(100)
            })
          })
        })

        it('should revoke all tokens for a user', function () {
          return model.revokeAllTokens(token.accessToken)
          .then((res) => {
            assert.ok(res.length === 4)
            if (test.type !== 'mongo') {
              assert.ok(res[0] > 0)
            }
          })
        })
      })
    })
  })
})
