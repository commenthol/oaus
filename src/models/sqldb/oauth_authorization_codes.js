module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_authorization_codes', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    authorizationCode: {
      type: DataTypes.STRING(255) + ' COLLATE utf8mb4_bin',
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    redirectUri: {
      type: DataTypes.STRING(2000) + ' COLLATE utf8mb4_bin',
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
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  })
}
