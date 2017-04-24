const express = require('express')
const hbs = require('express-hbs')
const oauth2router = require('..').router
// const httpError = require('http-error')

console.log(oauth2router)

const config = {
  database: {
    // connector: 'mongodb',
    // url: 'mongodb://localhost/oauth2'
    connector: 'mysql',
    url: 'mysql://dev:dev@localhost/oauth2'
  },
  login: {
    client: {clientId: 'login', clientSecret: 'loginSecret'}
  },
  csrfTokenSecret: 'CHANGE-THIS-IN-ANY-CASE!!!'
}

const app = express()
const {resolve} = require('path')

// static content
app.use(express.static(views('../public')))

app.engine('hbs', hbs.express4({
  partialsDir: [views('partials')],
  defaultLayout: views('layout/default.hbs')
}))

app.set('view engine', 'hbs')
app.set('views', views())

app.get('/', (req, res) => {
  res.render('index', {
    title: 'login'
  })
})

app.use('/', oauth2router(config))

app.listen(4000)

function views (path) {
  return resolve(__dirname, '..', 'views', path || '')
}
