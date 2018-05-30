const setCookie = require('set-cookie-parser')
const signedToken = require('signed-token')

function objectKeysType (obj) {
  const type = toString.call(obj).replace(/^\[object (.*)\]$/, '$1')
  switch (type) {
    case 'Object':
      let o = {}
      Object.keys(obj).forEach((k) => {
        o[k] = objectKeysType(obj[k])
      })
      return o
    case 'Array':
      return obj.map((k) => (objectKeysType(k)))
    default:
      return type
  }
}

function getCsrfToken (secret) {
  return signedToken(secret).createSync()
}

function setCookieParse (res) {
  let cookies = {}
  setCookie.parse(res).forEach(p => (cookies[p.name] = p))
  return cookies
}

module.exports = {
  objectKeysType,
  getCsrfToken,
  setCookieParse
}
