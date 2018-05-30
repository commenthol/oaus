#!/usr/bin/env node

/* eslint no-console:0 */

const {models} = require('..')

module.exports = createTables

function createTables (config) {
  const {db} = models(config)

  db.sequelize.sync()
    .then(() => console.log('done'))
    .catch((e) => console.log(e))

  // or each model individually
  /** /
  Object.keys(db.sequelize.models).forEach((m) => {
    db.sequelize.models[m].sync({force: false})
  })
  /**/
}

if (require.main === module) {
  const config = {
    connector: 'mysql',
    url: 'mysql://root:dev@localhost/oauth2',
    secret: 'secret'
  }
  createTables(config)
}
