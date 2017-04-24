const mongodb = {
  connector: 'mongodb',
  url: 'mongodb://localhost/oauth2'
}
const mysql = {
  connector: 'mysql',
  url: 'mysql://dev:dev@localhost/oauth2',
  logging: false
}

module.exports = {
  mongodb,
  mysql
}
