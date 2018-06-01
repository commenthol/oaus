const http = require('http')
const qs = require('querystring')
const cookie = require('./cookie')
const promisify = require('./promisify')

const log = require('debug-level').log('oaus')

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

function trimUrl (url) {
  if (url !== '/') {
    url = url.replace(/\/+$/, '')
  }
  return url
}

/**
 * @param {Object} client - `{clientId, clientSecret}`
 * @return {String} base64 encoded Basic Auth Header String
 */
function basicAuthHeader ({ clientId, clientSecret }) {
  return 'Basic ' + (Buffer.from(`${clientId}:${clientSecret || ''}`)).toString('base64')
}

function httpError (status, name, message) {
  const err = new Error(message || name)
  err.name = name || http.STATUS_CODES[status]
  err.statusCode = err.status = status
  return err
}

function wrapQuery (query) {
  return Buffer.from(qs.stringify(query || {})).toString('base64')
}

function unwrapQuery (string) {
  return Buffer.from(string || '', 'base64').toString()
}

function logRequest (req, res, next) {
  let {method, url, headers, params, query, body, baseUrl, originalUrl} = req
  console.log('logRequest', JSON.stringify({method, url, headers, params, query, body, baseUrl, originalUrl}, null, 2)) // eslint-disable-line no-console
  next()
}

function logResponse (req, res, next) {
  let {method, url} = req
  let {headers, body} = res
  console.log('logResponse', JSON.stringify({method, url, headers, body}, null, 2)) // eslint-disable-line no-console
  next()
}

function wrapError (err, o) {
  const { name, message, status, stack, code } = err
  return Object.assign({}, o, {
    error: message || name,
    code,
    status,
    stack
  })
}

function logError (err, req, res, next) {
  if (typeof err !== 'object') {
    err = new Error(err)
  }
  log.error(wrapError(err, {ip: req.ip}))
  next(err)
}

const isAjaxReq = (headers = {}) => (
  /\/json$/.exec(headers.accept) ||
  /\/json$/.exec(headers['content-type']) ||
  headers['X-Requested-With'] === 'XMLHttpRequest'
)

const isEnvDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

const isSecure = (req) => !!(
  req.protocol === 'https' ||
  req.headers['x-forwarded-proto'] === 'https' ||
  !isEnvDev
)

module.exports = {
  basicAuthHeader,
  cookie,
  fromArray,
  httpError,
  isAjaxReq,
  isEnvDev,
  isSecure,
  logError,
  logRequest,
  logResponse,
  objToArray,
  promisify,
  toArray,
  trimUrl,
  unwrapQuery,
  wrapError,
  wrapQuery
}
