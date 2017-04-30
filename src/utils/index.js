const debugFn = require('debug')
const csrfToken = require('./csrfToken')
const cookie = require('./cookie')
const qs = require('querystring')

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
  let {method, url, headers, params, query, body, baseUrl, originalUrl} = req
  console.log(JSON.stringify({method, url, headers, params, query, body, baseUrl, originalUrl}, null, 2))
  next()
}

function basicAuthHeader (client) {
  const {clientId, clientSecret} = client
  return 'Basic ' + (Buffer.from(`${clientId}:${clientSecret || ''}`)).toString('base64')
}

function wrapQuery (query) {
  return Buffer.from(qs.stringify(query || {})).toString('base64')
}

function unwrapQuery (string) {
  return Buffer.from(string || '', 'base64').toString()
}

module.exports = {
  csrfToken,
  cookie,
  debug,
  fromArray,
  toArray,
  objToArray,
  basicAuthHeader,
  logRequest,
  wrapQuery,
  unwrapQuery
}
