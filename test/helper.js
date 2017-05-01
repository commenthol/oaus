const objectKeysType = (obj) => {
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

module.exports = {
  objectKeysType
}
