const config = require('../../test/config')

Object.assign(config.oauth2, { // oauth2-server settings
  accessTokenLifetime: 60, // in seconds
  refreshTokenLifetime: 300
})

module.exports = config
