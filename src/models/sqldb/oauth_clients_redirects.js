module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_clients_redirects', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    redirectUri: {
      type: DataTypes.STRING(2000) + ' COLLATE utf8mb4_bin',
      allowNull: true
    },
    oauthClientId: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false
      // references: {
      //   model: 'oauth_clients',
      //   key: 'id'
      // }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'oauth_clients_redirects',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  })
}
