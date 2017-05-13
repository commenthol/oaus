const http = require('http')
const qs = require('querystring')
const csrfToken = require('./csrfToken')
const cookie = require('./cookie')

const DELIMITER = ' '

function fromArray (arr, delim) {
  return arr.join(delim || DELIMITER)
}

function toArray (str, delim) {
  if (!str) return
  return str.split(delim || DELIMITER)
}

function objToArray (obj) {
  return Object.keys(obj)
    .filter((k) => obj[k])
    .map((k) => ({name: k, value: obj[k]}))
}

function logRequest (req, res, next) {
  let {method, url, headers, params, query, body, baseUrl, originalUrl} = req
  console.log('logRequest', JSON.stringify({method, url, headers, params, query, body, baseUrl, originalUrl}, null, 2))
  next()
}

function logResponse (req, res, next) {
  let {method, url} = req
  let {headers, body} = res
  console.log('logResponse', JSON.stringify({method, url, headers, body}, null, 2))
  next()
}

function trimUrl (url) {
  if (url !== '/') {
    url = url.replace(/\/+$/, '')
  }
  return url
}

function basicAuthHeader (client) {
  const {clientId, clientSecret} = client
  return 'Basic ' + (Buffer.from(`${clientId}:${clientSecret || ''}`)).toString('base64')
}

function httpError (status, name, message) {
  const err = new Error(message || name)
  err.name = name || http.STATUS_CODES[status]
  err.status = status
  return err
}

function wrapQuery (query) {
  return Buffer.from(qs.stringify(query || {})).toString('base64')
}

function unwrapQuery (string) {
  return Buffer.from(string || '', 'base64').toString()
}

const promisify = (fn) =>
  (...args) => (
    new Promise((resolve, reject) => {
      fn(...args, (err, ...res) => {
        if (err) reject(err)
        else resolve(...res)
      })
    })
  )

module.exports = {
  csrfToken,
  cookie,
  fromArray,
  toArray,
  objToArray,
  trimUrl,
  basicAuthHeader,
  httpError,
  logRequest,
  logResponse,
  wrapQuery,
  unwrapQuery,
  promisify
}
