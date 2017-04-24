/* global describe, it, before */
const assert = require('assert')
const config = require('./support/config')
const {
  accessToken,
  refreshToken,
  authorizationCode,
  getUserClient,
  objectKeysType,
  timeout
} = require('./support/models-helper')

const models = require('../src/models')

// definition of test constants
const users = {
  admin: {username: 'admin@admin', password: 'admin'},
  user: {username: 'user@user', password: 'user'}
}
const clients = {
  demo: {name: 'demoName', clientId: 'demo', clientSecret: 'demoSecret'},
  login: {name: 'loginName', clientId: 'login', clientSecret: 'loginSecret'},
  client: {name: 'clientName', clientId: 'client', clientSecret: undefined}
}

// tests
describe('#models', function () {
  describe('mysql connector', function () {
    const {model} = models(config.mysql)

    describe('getUser', function () {
      it('should return user', function () {
        const {username, password} = users.user
        return model.getUser(username, password)
        .then((user) => {
          assert.strictEqual(user.username, username)
          assert.strictEqual(user.password, password)
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
          // console.log(client)
          assert.deepEqual(Object.keys(client).sort(), [
            'accessTokenLifetime',
            'clientId',
            'clientSecret',
            'createdAt',
            'grants',
            'id',
            'name',
            'redirectUris',
            'refreshTokenLifetime',
            'scope',
            'updatedAt',
            'userId' ])
          assert.strictEqual(client.name, 'demoName')
          assert.strictEqual(client.clientId, 'demo')
          assert.strictEqual(client.clientSecret, 'demoSecret')
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
          assert.strictEqual(client.clientSecret, null)
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
          assert.deepEqual(objectKeysType(res), {
            client: {
              id: 'Number',
              name: 'String',
              clientId: 'String',
              clientSecret: 'String',
              grants: [ 'String', 'String', 'String', 'String' ],
              refreshTokenLifetime: 'Null',
              accessTokenLifetime: 'Null',
              scope: 'Null',
              createdAt: 'Date',
              updatedAt: 'Date',
              userId: 'Number',
              redirectUris: [ 'String', 'String' ]
            },
            user: {
              id: 'Number',
              username: 'String',
              password: 'String',
              scope: 'Null'
            },
            accessToken: 'String',
            accessTokenExpiresAt: 'Date',
            scope: 'Null'
          })
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
          assert.deepEqual(objectKeysType(res), { id: 'Number',
            accessToken: 'String',
            accessTokenExpiresAt: 'Date',
            scope: 'Null',
            user: { id: 'Number', username: 'String' },
            client: { id: 'Number', clientId: 'String', scope: 'Null' } })
          assert.equal(res.accessToken, token.accessToken)
          token.accessTokenExpiresAt.setMilliseconds(0)
          assert.equal(res.accessTokenExpiresAt.toISOString(), token.accessTokenExpiresAt.toISOString())
        })
      })

      it('should not get access token', function () {
        return model.getAccessToken('token.accessToken')
        .then((res) => {
          assert.deepEqual(objectKeysType(res), 'Undefined')
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
          assert.deepEqual(objectKeysType(res), { id: 'Number',
            refreshToken: 'String',
            refreshTokenExpiresAt: 'Date',
            scope: 'Null',
            user: { id: 'Number', username: 'String' },
            client: { id: 'Number', clientId: 'String', scope: 'Null' } })
          assert.equal(res.refreshToken, token.refreshToken)
          token.refreshTokenExpiresAt.setMilliseconds(0)
          assert.equal(res.refreshTokenExpiresAt.toISOString(), token.refreshTokenExpiresAt.toISOString())
        })
      })

      it('should not get refresh token', function () {
        return model.getRefreshToken('token.refreshToken')
        .then((res) => {
          assert.deepEqual(objectKeysType(res), 'Undefined')
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
          code.expiresAt.setMilliseconds(0)
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
          assert.deepEqual(objectKeysType(res), {
            id: 'Number',
            authorizationCode: 'String',
            expiresAt: 'Date',
            redirectUri: 'String',
            scope: 'Null',
            user: { id: 'Number', username: 'String', scope: 'Null' },
            client:
            { id: 'Number',
              name: 'String',
              clientId: 'String',
              scope: 'Null'
            }
          })
          assert.equal(res.authorizationCode, code.authorizationCode)
          code.expiresAt.setMilliseconds(0)
          assert.equal(res.expiresAt.toISOString(), code.expiresAt.toISOString())
          assert.equal(res.redirectUri, code.redirectUri)
          assert.deepEqual(res.user, { id: 2, username: 'user@user', scope: null })
          assert.deepEqual(res.client, { id: 1, name: 'demoName', clientId: 'demo', scope: null })
        })
      })
    })

    describe('getUserFromClient', function () {
      it('should get user from client', function () {
        return model.getUserFromClient(clients.demo)
        .then((res) => {
          assert.deepEqual(objectKeysType(res), {
            id: 'Number',
            clientId: 'String',
            user: {
              id: 'Number',
              username: 'String',
              password: 'String',
              scope: 'Null'
            }
          })
          assert.strictEqual(res.user.username, 'admin@admin')
          assert.strictEqual(res.user.password, 'admin')
        })
      })
      it('should get user from client without secret', function () {
        return model.getUserFromClient(clients.client)
        .then((res) => {
          assert.deepEqual(objectKeysType(res), {
            id: 'Number',
            clientId: 'String',
            user: {
              id: 'Number',
              username: 'String',
              password: 'String',
              scope: 'Null'
            }
          })
          assert.strictEqual(res.user.username, 'admin@admin')
          assert.strictEqual(res.user.password, 'admin')
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
          assert.strictEqual(res, undefined)
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
          assert.strictEqual(res, undefined)
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
          assert.ok(res.length === 3)
          assert.ok(res[0] > 0)
        })
      })
    })
  })
})
