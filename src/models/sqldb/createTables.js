
const model = require('.')

module.exports = createTables

function createTables (config) {
  const {db} = model.connect(config)

  Object.keys(db.sequelize.models).forEach((m) => {
    db.sequelize.models[m].sync()
  })
}

if (require.main === module) {
  main()
}

function main () {
  const config = {
    connector: 'mysql',
    url: 'mysql://dev:dev@localhost/oauth2',
    logging: true
  }
  createTables(config)
  console.log('Please stop process with ^C if all tables where created')
}
