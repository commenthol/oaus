const express = require('express')
const {resolve} = require('path')
const oauth2 = require('..')

const config = {
  database: {
    // connector: 'mongodb',
    // url: 'mongodb://localhost/oauth2'
    connector: 'mysql',
    url: 'mysql://dev:dev@localhost/oauth2'
  }
}

const oauth2mw = new oauth2.OAuth2Mw(config)

const app = express()

app.use(express.static(resolve(__dirname, '../public')))

app.use('/login', oauth2.login.app({
  csrfTokenSecret: 'CHANGE-THIS-IN-ANY-CASE!!!',
  client: {clientId: 'login', clientSecret: 'loginsecret'},
  oauth2mw: oauth2mw
}))

app.listen(4000)
