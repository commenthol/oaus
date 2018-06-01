/**
 * @private
 */
const objToArray = (obj = {}) =>
  Object.keys(obj)
    .filter((k) => obj[k])
    .map((k) => ({name: k, value: obj[k]}))

module.exports = objToArray
