const mongoose = require('mongoose')
const {mongodb, users, clients, scopes} = require('./config')

function clear (model) {
  return model.find({}).remove()
}

function create (model, items) {
  return model.create(items).then(() => {
    console.log('finished', model.modelName)
  })
}

module.exports = init

function init () {
  const {models} = require('../..')
  const {db, model} = models(mongodb)
  const {Users, OAuthClients, OAuthScopes} = db

  return clear(OAuthScopes)
  .then(() => create(OAuthScopes, scopes))
  .then(() => clear(OAuthClients))
  .then(() => clear(Users))
  .then(() => model.upsertUser(users[0]))
  .then(() => model.upsertClient(users[0].username, clients[0]))
  .then(() => model.upsertClient(users[0].username, clients[1]))
  .then(() => mongoose.connection.close())
}

if (require.main === module) {
  init().then(() => {
    console.log('done')
  })
}
