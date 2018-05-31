/* eslint no-console:0 */
/**
* small app to design/ test templates only
*/

const express = require('express')
const bodyParser = require('body-parser')
const {resolve} = require('path')
const views = require('../views')
const oaus = require('../../..')
const version = require('../../../package.json').version

const app = express()
views(app) // set hbs views

app.locals.version = version
app.use(express.static(resolve(__dirname, '../static')))

app.post('/*',
  bodyParser.urlencoded({extended: false}),
  (req, res, next) => {
    console.log(req.body)
    next()
  }
)
app.get(
  (req, res, next) => {
    console.log(req.query)
    next()
  }
)

app.get('/test', (req, res) => {
  res.render('pages/uxtest', {
    title: 'UX-Test Home'
  })
})

app.use('/error(/:status)?',
  (req, res, next) => {
    const status = req.params.status || 500
    next(oaus.utils.httpError(status))
  }
)

const client = (req, res, next) => {
  res.render('pages/home', {
    title: 'Client',
    uri: {loginURL: '/login', logoutURL: '/logout', joinURL: '/join'},
    username: req.params.username
  })
}
app.use('/:username', client)
app.use('/', client)

// ---- final error handler ----
oaus.error(app)
app.use((_err, req, res, _next) => {
  res.render('pages/error', res.body)
})

const PORT = 4002
app.listen(PORT, 'localhost', () => {
  console.log(`app-ux running http://localhost:${PORT}`)
})
