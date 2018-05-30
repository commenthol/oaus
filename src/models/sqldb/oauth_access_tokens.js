module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_access_tokens', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    accessToken: {
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
    tableName: 'oauth_access_tokens',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: false
  })
}
