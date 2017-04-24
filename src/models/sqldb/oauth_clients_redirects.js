/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_clients_redirects', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    redirectUri: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    oauthClientId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'oauth_clients',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'oauth_clients_redirects'
  })
}
