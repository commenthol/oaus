
const http = require('http')
const app = require('express')()
const bodyParser = require('body-parser')
const log = require('debug')('test:app')
const oaus = require('../..')

function logger (req, res, next) { // TODO debug
  log('>>>', req.method, req.url, req.headers, req.body)
  res.on('finish', () => {
    log('<<<', res.statusCode, res.body)
  })
  next()
}

function setup (config) {
  const store = {}
  const routers = oaus.routers(config)

  app.use(
    bodyParser.json({extended: true}),
    bodyParser.urlencoded({extended: true}),
    logger
  )

  app.use(config.paths.logout,
    routers.logout,
    (req, res, next) => {
      log(res.body)
      res.json(res.body)
    }
  )

  app.use(config.paths.login,
    routers.login,
    (req, res, next) => {
      log(res.body)
      res.json(res.body)
    }
  )

  app.use(config.paths.oauth,
    routers.oauth
  )

  app.get('/resource/user',
    routers.authenticate,
    (req, res, next) => {
      log(req.locals.user) // TODO
      const { scope } = req.locals
      const { username, logoutToken } = req.locals.user
      const body = { username, logoutToken, scope }
      res.json(body)
    }
  )

  app.post('/auth/logout', (req, res) => {
    const {logoutToken} = req.body
    if (store.logoutToken !== logoutToken) {
      store.logoutToken = logoutToken
      store.count = 0
    }
    store.count++
    res.end()
  })

  app.get('/auth/test/logoutToken', (req, res) => {
    res.json(store)
  })

  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    // console.error(err)
    res.statusCode = err.status
    res.json(res.body)
  })

  let server
  app.start = (port, cb) => {
    server = http.createServer(app)
    server.listen(port, cb)
  }
  app.close = (cb) => {
    if (!server) cb && cb()
    else server.close(cb)
  }

  return app
}

module.exports = setup

if (module === require.main) {
  const config = require('../config')
  setup(config).listen(3000)
}
