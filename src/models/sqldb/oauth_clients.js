/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_clients', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientId: {
      type: DataTypes.STRING(80) + ' COLLATE utf8_bin',
      allowNull: true,
      unique: true
    },
    clientSecret: {
      type: DataTypes.STRING(80) + ' COLLATE utf8_bin',
      allowNull: true
    },
    grants: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    refreshTokenLifetime: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true
    },
    accessTokenLifetime: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
      // references: {
      //   model: 'oauth_users',
      //   key: 'id'
      // }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
      // defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
      // defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'oauth_clients',
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    timestamps: true
  })
}
