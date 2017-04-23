const mongodb = {
  connector: 'mongodb',
  url: 'mongodb://localhost/oauth2'
}
const mysql = {
  connector: 'mysql',
  url: 'mysql://dev:dev@localhost/oauth2',
  logging: false
}
const users = [{
  username: 'admin',
  password: 'admin'
}]
const clients = [{
  name: 'demo',
  clientId: 'democlient',
  clientSecret: 'democlientsecret',
  redirectUri: 'http://localhost:3000/cb',
  grants: ['authorization_code', 'password', 'refresh_token', 'client_credentials'],
  accessTokenLifetime: 60
}, {
  name: 'password only',
  clientId: 'password',
  clientSecret: 'passwordsecret',
  redirectUri: 'http://localhost:3000/cb',
  grants: ['password']
}]
const scopes = [{
  scope: 'demo',
  isDefault: true
}, {
  scope: 'profile',
  isDefault: false
}]

module.exports = {
  users,
  clients,
  scopes,
  mongodb,
  mysql
}
