const express = require('express')

const app = express()

const log = (num) => (req, res, next) => {
  const {method, url, baseUrl, originalUrl} = req
  console.log(num, {method, url, baseUrl, originalUrl})
  next()
}
const end = (req, res) => {
  const {method, url, baseUrl, originalUrl} = req
  res.json({method, url, baseUrl, originalUrl})
}

app.get('/', log(0), end)

const app1 = express()

app1.get('/', log(1), end)
app.use('/login', app1)

app.listen(3000)
