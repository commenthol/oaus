/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_refresh_tokens', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    refreshToken: {
      type: DataTypes.STRING(255) + ' COLLATE utf8_bin',
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
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
    tableName: 'oauth_refresh_tokens',
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    timestamps: false
  })
}
