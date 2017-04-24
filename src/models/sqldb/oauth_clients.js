/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_clients', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientId: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    clientSecret: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    grants: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    refreshTokenLifetime: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    accessTokenLifetime: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
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
    tableName: 'oauth_clients'
  })
}
