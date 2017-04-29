
const model = require('.')

module.exports = createTables

function createTables (config) {
  const {db} = model.connect(config)

  Object.keys(db.sequelize.models).forEach((m) => {
    db.sequelize.models[m].sync({force: false})
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
  console.log('IMPORTANT: You might run this script ~3 times as tables have associations.')
}
