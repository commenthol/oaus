const { fork } = require('child_process')
const { resolve } = require('path')

process.env.DEBUG = process.env.DEBUG || 'client,oaus*'

const pids = [
  fork(resolve(__dirname, 'server/app.js')),
  fork(resolve(__dirname, 'client/app.js'))
]

process.on('SIGINT', function () {
  pids.forEach(pid => pid.kill('SIGINT'))
  process.exit()
})
