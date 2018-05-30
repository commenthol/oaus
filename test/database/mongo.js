/* eslint no-console:0 */

const {collections} = require('./fixtures')
const config = require('../config').mongo()
const {models} = require('../..')

function setup (model) {
  const deleteAll = () => {
    return model.db.OAuthUsers.remove()
      .then(() => model.db.OAuthClients.remove())
      .then(() => model.db.OAuthAuthorizationCodes.remove())
      .then(() => model.db.OAuthAccessTokens.remove())
      .then(() => model.db.OAuthRefreshTokens.remove())
  }
  const insertUsers = (rows) => model.db.OAuthUsers.create(rows)
  const insertClients = (rows, users) => {
    rows = rows.map((row) => {
      row.userId = users[row.userId]._id
      return row
    })
    return model.db.OAuthClients.create(rows)
  }

  const main = () => collections.update()
    .then(() => deleteAll())
    .then(() => insertUsers(collections.users))
    .then((users) => insertClients(collections.clients, users))
    .catch((e) => console.error(e))

  return main
}

module.exports = setup

if (require.main === module) {
  const { model } = models(config.database)
  setup(model)().then(() => process.exit(0))
}
