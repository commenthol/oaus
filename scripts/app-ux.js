/* eslint no-console:0 */
/**
* small app to design/ test templates only
*/

const express = require('express')
const bodyParser = require('body-parser')
const {resolve} = require('path')
const oauth2 = require('..')

const app = express()
oauth2.views(app) // set hbs views

app.use(express.static(resolve(__dirname, '../public')))

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
app.use('/login',
  (req, res, next) => {
    res.render('layout/login', {
      title: 'Login',
      alert: {strong: 'The CSRF token is invalid!', text: 'Please try to resubmit the form'},
      hidden: [
        {name: 'grant_type', value: 'password'}
      ]
    })
  }
)
app.use('/error/:status',
  (req, res, next) => {
    const status = req.params.status || 500
    next(oauth2.utils.httpError(status))
  }
)
oauth2.error(app) // set error pages

app.listen(4001)
