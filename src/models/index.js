/**
* connect to database
* @param {Object} config
* @param {String} config.connector - `'mongodb'|'mysql'|'mariadb'|'sqlite'|'postgres'|'mssql'`
* @param {String} config.url - database connection url
* @param {String} config.secret - secret for signed tokens
* @return {Object} db, model object `{db, model}`
*/
module.exports = function (config) {
  return strategy(config).connect(config)
}

/**
* @private
*/
function strategy (config) {
  return config.connector === 'mongodb'
    ? require('./mongodb')
    : require('./sqldb')
}
