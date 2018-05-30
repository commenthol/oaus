const cookie = require('cookie')

const SET_COOKIE = 'set-cookie'

module.exports = {
  serialize: cookie.serialize,
  parse: cookie.parse,
  set: set
}

function set (res, name, value, options) {
  const data = cookie.serialize(name, value, options)

  const prev = res.getHeader(SET_COOKIE) || []
  const header = Array.isArray(prev)
    ? prev.concat(data)
    : Array.isArray(data)
      ? [prev].concat(data)
      : [prev, data]

  res.setHeader(SET_COOKIE, header)
}
