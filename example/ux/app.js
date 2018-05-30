/* eslint no-console:0 */
/**
* small app to design/ test templates only
*/

const express = require('express')
const bodyParser = require('body-parser')
const {resolve} = require('path')
const views = require('../views')
const oaus = require('../..')
const version = require('../../package.json').version

const app = express()
views(app) // set hbs views

app.locals.version = version
app.use(express.static(resolve(__dirname, './static')))

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

app.get('/', (req, res) => {
  res.render('layout/home-uxtest', {
    title: 'UX-Test Home'
  })
})

app.use('/login',
  (req, res, next) => {
    res.render('layout/login', {
      title: 'Sign in to OAus',
      alert: {strong: 'The CSRF token is invalid!', text: 'Please try to resubmit the form'},
      uri: {joinURL: '/join'},
      hidden: [
        {name: 'grant_type', value: 'password'},
        {name: 'state', value: 'stateStateState'}
      ]
    })
  }
)

app.use('/logout', (req, res) => {
  res.render('layout/logout', {
    title: 'Sign out from OAus',
    header: 'off',
    hidden: [
      {name: 'state', value: 'stateStateState'}
    ]
  })
})

app.use('/join',
  (req, res, next) => {
    res.render('layout/join', {
      title: 'Sign up to OAus',
      alert: {strong: 'Passwords don\'t match!', text: 'Please try to resubmit the form'},
      hidden: [
        {name: 'state', value: 'stateStateState'}
      ]
    })
  }
)

const client = (req, res, next) => {
  res.render('layout/client', {
    title: 'OAus Client',
    uri: {loginURL: '/login', logoutURL: '/logout', joinURL: '/join'},
    username: req.params.username
  })
}
app.use('/client/:username', client)
app.use('/client', client)

app.use('/error/:status',
  (req, res, next) => {
    const status = req.params.status || 500
    next(oaus.utils.httpError(status))
  }
)
// ---- final error handler ----
oaus.error(app)
app.use((_err, req, res, _next) => {
  res.render('layout/error', res.body)
})

const PORT = 4001
app.listen(PORT, 'localhost', () => {
  console.log(`app-ux running http://localhost:${PORT}`)
})
