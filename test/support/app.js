const bodyParser = require('body-parser')
const express = require('express')

const {oauth2} = require('../..')

module.exports = appFn

function appFn (config) {
  const app = express()

  // callback
  app.get('/cb', (req, res) => {
    res.send('callback')
  })

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(oauth2(config))

  app.use((req, res) => {
    res.send('Secret area')
  })

  return app
}

if (require.main === module) {
  const {mongodb} = require('./config')
  appFn(mongodb).listen(3000)
}
