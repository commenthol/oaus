/**
* Helper function for SQL stored procedures
*/

const _get = require('lodash.get')
const _set = require('lodash.set')
const sqlString = require('sqlstring')

/**
* converts Date to SQL DATETIME
* sequelize converts all dates to UTC
* @param {Date} date
* @return {String} SQL DATETIME in UTC
*/
function toDateTime (date) {
  return date.toISOString().replace(/^([0-9-]+)T([0-9:]+)(\.\d+|)Z$/, "'$1 $2'")
}

/**
* build SQL CALL to stored procedure
* @param {String} fnName -
*/
function callBuilder (fnName, ...args) {
  const callArgs = args.map((arg) => {
    if (arg instanceof Date) {
      return toDateTime(arg)
    }
    return sqlString.escape(arg)
  })
  fnName = fnName.replace(/[^A-Za-z0-9_-]/g, '')
  const query = `CALL ${fnName}(${callArgs.join(',')});`
  return query
}

/**
* keep throwing an database error
*/
function throwOnDbErr (err) {
  if (_get(err, 'original.code')) {
    throw err
  }
}

/**
* convert plain columns into a json object
* @param {Object} data
* @return {Object}
* @example
* toJSON({'user.id': 1, test: 2})
* > {user: {id: 1}, test: 2}
*/
function toJSON (data) {
  const obj = {}
  if (!data) return
  Object.keys(data).forEach((k) => _set(obj, k, data[k]))
  return obj
}

module.exports = {
  callBuilder,
  throwOnDbErr,
  toJSON
}
