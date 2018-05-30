/* eslint no-console:0 */

/*
 * fixtures for database
 */

const async = require('asyncc-promise')
const passwordHash = require('pbkdf2-password-hash')

const now = new Date()

const collections = {
  users: [
    {
      identifier: 'admin',
      username: 'admin@admin',
      password: 'admin',
      scope: null,
      remember: false,
      logoutToken: 'zfdfMCQoUnBAlCnweW0zJHaHynA2Uz8n',
      createdAt: now,
      lastSignInAt: now,
      lastSignOutAt: now
    }, {
      identifier: 'user',
      username: 'user@user',
      password: 'user',
      scope: 'read',
      remember: false,
      logoutToken: 'zfdfMCQoUnBAlCnweW0zJHaHynA2Uz8n',
      createdAt: now,
      lastSignInAt: now,
      lastSignOutAt: now
    }
  ],
  clients: [
    {
      name: 'loginName',
      clientId: 'login',
      secret: 'loginsecret',
      grants: ['password', 'refresh_token'],
      redirectUris: ['/'],
      refreshTokenLifetime: null,
      accessTokenLifetime: null,
      scope: 'read write',
      userId: 0, // admin@admin
      createdAt: now
    }, {
      name: 'demoName',
      clientId: 'demo',
      secret: 'demosecret',
      grants: ['authorization_code', 'password', 'refresh_token', 'client_credentials'],
      redirectUris: [
        'http://localhost:3000/auth/callback',
        'http://localhost:3000/auth/callback',
        'http://localhost:3000/callback1'
      ],
      refreshTokenLifetime: null,
      accessTokenLifetime: null,
      scope: 'read write',
      logoutURI: 'http://localhost:3000/auth/logout',
      userId: 0, // admin@admin
      createdAt: now
    }, {
      name: 'clientName',
      clientId: 'client',
      secret: 'clientsecret',
      grants: ['authorization_code', 'password', 'refresh_token', 'client_credentials'],
      redirectUris: ['/callback'],
      refreshTokenLifetime: null,
      accessTokenLifetime: null,
      scope: 'read write',
      logoutURI: 'http://localhost:3000/auth/logout',
      userId: 1, // user@user
      createdAt: now
    }
  ]
}

const users = collections.users.reduce((o, user) => {
  const {identifier, username, password} = user
  o[identifier] = {identifier, username, password}
  return o
}, {})

const clients = collections.clients.reduce((o, client) => {
  const {name, clientId, clientSecret} = client
  o[clientId] = {name, clientId, clientSecret}
  return o
}, {})

/**
 * update passwords
 */
collections.update = () => (
  Promise.all([
    async.each(collections.users,
      (user, i) => {
        return passwordHash.hash(user.password)
          .then((password) => {
            Object.assign(collections.users[i], {password, updatedAt: new Date()})
          })
      }
    ),
    async.each(collections.clients,
      (client, i) => {
        return passwordHash.hash(client.secret)
          .then((secret) => {
            Object.assign(collections.clients[i], {secret, updatedAt: new Date()})
          })
      }
    )
  ])
)

module.exports = {
  collections,
  users,
  clients
}

if (require.main === module) {
  console.log(users)
  console.log(clients)

  collections.update().then(() => {
    console.log(JSON.stringify(collections, null, 2))
  }).catch((e) => {
    console.error(e)
  })
}
