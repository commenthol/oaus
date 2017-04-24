const express = require('express')
const hbs = require('express-hbs')
const oauth2router = require('../..').router
const {resolve} = require('path')

console.log(oauth2router)

const config = {
  viewPath: resolve(__dirname, '..', 'views'),  // path to `/views` folder
  database: { // database settings
    connector: 'mysql',
    url: 'mysql://localhost/oauth2',
    user: 'dev',
    password: 'dev'
  },
  csrfTokenSecret: 'CHANGE-THIS-IN-ANY-CASE!!!'
}

const app = express()

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
  return resolve(config.viewPath, path || '')
}
