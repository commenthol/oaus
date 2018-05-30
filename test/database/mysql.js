/* eslint no-console:0 */

const {collections} = require('./fixtures')
const config = require('../config').mysql()
const {models} = require('../..')

function setup (model) {
  const deleteAll = () => {
    return model.db.OAuthUsers.findAll()
      .then((data) => data && data.forEach((d) => d.destroy()))
      .then(() => model.db.OAuthClients.findAll())
      .then((data) => data && data.forEach((d) => d.destroy()))
      .then(() => model.db.OAuthClientsRedirects.findAll())
      .then((data) => data && data.forEach((d) => d.destroy()))
  }
  const insertUsers = (rows) => model.db.OAuthUsers.bulkCreate(rows)
  const getBulkUserId = (rows) => model.db.OAuthUsers.findOne({
    attributes: ['id'],
    where: {
      username: rows[0].username
    }
  }).then((data) => data.id)
  const insertClients = (rows, userId) => {
    rows = rows.map((row) => {
      row.userId += userId
      row.grants = row.grants.join(' ')
      return row
    })
    return model.db.OAuthClients.bulkCreate(rows)
  }
  const getBulkClientId = (rows) => model.db.OAuthClients.findOne({
    attributes: ['id'],
    where: {
      clientId: rows[0].clientId
    }
  }).then((data) => data && data.id)
  const insertClientRedirects = (rows, clientId) => {
    let redirects = []
    rows.forEach((row, i) => {
      row.redirectUris.forEach((redirectUri) => {
        redirects.push({
          redirectUri,
          oauthClientId: clientId + i
        })
      })
    })
    return model.db.OAuthClientsRedirects.bulkCreate(redirects)
  }

  const main = () => collections.update()
    .then(() => model.db.sequelize.sync())
    .then(() => deleteAll())
    .then(() => insertUsers(collections.users))
    .then(() => getBulkUserId(collections.users))
    .then((id) => insertClients(collections.clients, id))
    .then(() => getBulkClientId(collections.clients))
    .then((id) => insertClientRedirects(collections.clients, id))
    .catch((e) => console.error(e))

  return main
}

module.exports = setup

if (require.main === module) {
  const { model } = models(config.database)
  setup(model)()
    .then(() => process.exit(0))
}
