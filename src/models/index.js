/**
* connect to database
* @param {String} connector - `'mongodb'|'mysql'|'mariadb'|'sqlite'|'postgres'|'mssql'`
* @param {Object} config - database config
* @return {Object} db, model object `{db, model}`
*/
module.exports = function ({ connector, ...config }) {
  return strategy(connector).connect(config)
}

/**
* @private
*/
function strategy (connector) {
  return connector === 'mongodb'
    ? require('./mongodb')
    : require('./sqldb')
}
