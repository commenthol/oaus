/* eslint no-console:0 */

const assert = require('assert')
const _ = require('lodash')

const {
  accessToken,
  refreshToken,
  authorizationCode,
  getUserClient,
  timeout
} = require('./support')
const {
  objectKeysType
} = require('../support')

// definition of test constants
const {users, clients} = require('../database/fixtures')

const config = require('../config').database
const preMongo = require('../database/mongo')
const preMysql = require('../database/mysql')

const { models } = require('../..')

const test = {
  name: config.connector,
  config
}
if (config.connector === 'mongodb') {
  test.type = 'mongo'
}

describe('#models', function () {
  describe(test.name, function () {
    let t
    let model = models(test.config).model

    before(() => {
      t = timer()
      return (test.type === 'mongo'
        ? preMongo(model)()
        : preMysql(model)()
      )
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
            assert.deepEqual(Object.keys(_.omit(client, ['id', '_id', '__v'])).sort(), [
              'accessTokenLifetime',
              'clientId',
              'createdAt',
              'grants',
              'logoutURI',
              'name',
              'redirectUris',
              'refreshTokenLifetime',
              'scope',
              'secret',
              'updatedAt',
              'userId'
            ])
            assert.strictEqual(client.name, 'demoName')
            assert.strictEqual(client.clientId, 'demo')
            assert.deepEqual(client.grants, ['authorization_code', 'password', 'refresh_token', 'client_credentials'])
            assert.deepEqual(client.redirectUris, ['http://localhost:3000/auth/callback', 'http://localhost:3000/callback1'])
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
            assert.deepEqual(client.redirectUris, ['/callback'])
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
        return getUserClient(model, users.user, clients.demo)
          .then((res) => {
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
                  __v: 'Number',
                  _id: { _bsontype: 'String', id: 'Uint8Array' },
                  name: 'String',
                  logoutURI: 'String',
                  clientId: 'String',
                  secret: 'String',
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
                  __v: 'Number',
                  _id: { _bsontype: 'String', id: 'Uint8Array' },
                  username: 'String',
                  scope: 'String',
                  remember: 'Boolean',
                  logoutToken: 'String',
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
              let exp = {
                client: {
                  id: 'Number',
                  name: 'String',
                  clientId: 'String',
                  secret: 'String',
                  grants: [ 'String', 'String', 'String', 'String' ],
                  refreshTokenLifetime: 'Null',
                  accessTokenLifetime: 'Null',
                  scope: 'String',
                  createdAt: 'Date',
                  updatedAt: 'Date',
                  userId: 'Number',
                  redirectUris: [ 'String', 'String' ],
                  logoutURI: 'String'
                },
                user: {
                  id: 'Number',
                  username: 'String',
                  password: 'String',
                  scope: 'String',
                  remember: 'Boolean',
                  logoutToken: 'String',
                  lastSignInAt: 'Date',
                  lastSignOutAt: 'Date'
                },
                accessToken: 'String',
                accessTokenExpiresAt: 'Date',
                scope: 'Null'
              }
              assert.deepEqual(objectKeysType(res), exp)
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
            return model.generateAccessToken(client, user)
          })
          .then((value) => {
            token = accessToken(value, 60)
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
            assert.equal(res.accessToken, test.config.signedTokenFn.hmac(token.accessToken))
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
            return Promise.all([
              model.generateAccessToken(client, user),
              model.generateRefreshToken(client, user)
            ])
          })
          .then(([atValue, rtValue]) => {
            token = accessToken(atValue, 60)
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
            assert.ok(res.refreshToken !== token.refreshToken) // the saved token is hashed
            if (test.type !== 'mongo') {
              token.refreshTokenExpiresAt.setMilliseconds(0)
            }
            assert.equal(res.refreshTokenExpiresAt.toISOString(),
              token.refreshTokenExpiresAt.toISOString()
            )
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
            return model.generateAuthorizationCode()
          })
          .then((value) => {
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
                __v: 'Number',
                _id: { _bsontype: 'String', id: 'Uint8Array' },
                username: 'String',
                scope: 'Null',
                logoutToken: 'String',
                lastSignInAt: 'Date',
                lastSignOutAt: 'Date',
                createdAt: 'Date',
                updatedAt: 'Date',
                remember: 'Boolean'
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
            assert.strictEqual(res.username, 'user@user')
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
            assert.ok(res)
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

      beforeEach(function () {
        return getUserClient(model, users.user, clients.demo)
          .then((res) => {
            user = res[0]
            const client = res[1]
            return Promise.all([
              model.generateAccessToken(),
              model.generateRefreshToken(),
              model.generateAuthorizationCode()
            ])
              .then(([atVal, rtVal, acVal]) => {
                token = accessToken(atVal, 60)
                Object.assign(token, refreshToken(rtVal, 60))
                const code = authorizationCode(acVal, 60, '/cb')
                return Promise.all([
                  model.saveAuthorizationCode(code, client, user),
                  model.saveToken(token, client, user)
                ]).then(() => {
                  return timeout(100)
                })
              })
          })
      })

      it('should revoke all tokens for an user', function () {
        return model.revokeAllTokens(token.accessToken)
          .then((res) => {
            assert.ok(res.user)
            assert.equal(res.user.username, 'user@user')
            assert.ok(res.result)
            assert.ok(res.result.length === 4)
            if (test.type !== 'mongo') {
              assert.ok(res.result[0] > 0)
            }
          })
      })

      it('should throw using an unknown token', function () {
        return model.revokeAllTokens(token.accessToken + 'xxx')
          .then((res) => {
            assert.ok(false, 'never reach here')
          })
          .catch((err) => {
            assert.equal(err.message, 'no token or userId found')
          })
      })

      it('should revoke all tokens for a user using refreshToken', function () {
        return model.revokeAllTokens(token.accessToken, token.refreshToken)
          .then((res) => {
            assert.ok(res.user)
            assert.equal(res.user.username, 'user@user')
            assert.ok(res.result)
            assert.ok(res.result.length === 4)
            if (test.type !== 'mongo') {
              assert.ok(res.result[0] > 0)
            }
          })
      })
    })

    describe('logoutClients', function () {
      const test = {}
      let token
      let user

      before(function () {
        return getUserClient(model, users.user, clients.demo)
          .then((res) => {
            user = res[0]
            test.id = {id: user.id, _id: user._id}
            const client = res[1]
            return Promise.all([
              model.generateAccessToken(),
              model.generateRefreshToken(),
              model.generateAuthorizationCode()
            ])
              .then(([atVal, rtVal, acVal]) => {
                token = accessToken(atVal)
                Object.assign(token, refreshToken(rtVal))
                const code = authorizationCode(acVal, undefined, '/cb')
                return Promise.all([
                  model.saveAuthorizationCode(code, client, user),
                  model.saveToken(token, client, user)
                ]).then(() => {
                  return timeout(100)
                })
              })
          })
      })

      it('should revoke all tokens for a user', function () {
        return model.logoutClients(test.id)
          .then((res) => {
            // console.log('%j', res)
            assert.ok(res.user)
            assert.ok(res.clients)
            const logoutURIs = res.clients.map((client) => client.logoutURI)
            assert.deepEqual(logoutURIs, [
              'http://localhost:3000/auth/logout'
            ])
          })
      })
    })
  })
})

function timer () {
  let start = Date.now()
  return function (name) {
    let end = Date.now()
    console.log('>>timer(ms)', name, end - start)
    start = end
  }
}
