const debugFn = require('debug')
const csrfToken = require('./csrfToken')
const cookie = require('./cookie')

const debug = debugFn('oauth2-router')
debug.error = debugFn('oauth2-router::error')

const DELIMITER = ','

function fromArray (arr, delim) {
  return arr.join(delim || DELIMITER)
}

function toArray (str, delim) {
  return str.split(delim || DELIMITER)
}

function objToArray (obj) {
  return Object.keys(obj)
    .filter((k) => obj[k])
    .map((k) => ({name: k, value: obj[k]}))
}

function logRequest (req, res, next) {
  let {method, url, headers, params, query, body} = req
  console.log(JSON.stringify({method, url, headers, params, query, body}, null, 2))
  next()
}

module.exports = {
  csrfToken,
  cookie,
  debug,
  fromArray,
  toArray,
  objToArray,
  logRequest
}
