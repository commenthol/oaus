/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_authorization_codes', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    authorizationCode: {
      type: DataTypes.STRING(255) + ' COLLATE utf8_bin',
      allowNull: true,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    redirectUri: {
      type: DataTypes.STRING(2000) + ' COLLATE utf8_bin',
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    oauthClientId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
      // references: {
      //   model: 'oauth_clients',
      //   key: 'id'
      // }
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
      // references: {
      //   model: 'oauth_users',
      //   key: 'id'
      // }
    }
  }, {
    tableName: 'oauth_authorization_codes',
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    timestamps: false
  })
}
