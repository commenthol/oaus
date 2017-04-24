const cookie = require('cookie')

module.exports = {
  serialize: cookie.serialize,
  parse: cookie.parse,
  set: set
}

function set (res, name, value, options) {
  const data = cookie.serialize(name, value, options)

  const prev = res.getHeader('set-cookie') || []
  const header = Array.isArray(prev)
    ? prev.concat(data)
    : Array.isArray(data)
      ? [prev].concat(data)
      : [prev, data]

  res.setHeader('set-cookie', header)
}
