/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_authorization_codes', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    authorizationCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    redirectUri: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(255),
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
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'oauth_authorization_codes',
    timestamps: false
  })
}
