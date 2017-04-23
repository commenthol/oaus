module.exports = function (sequelize, DataTypes) {
  const OAuthRefreshTokens = sequelize.define('OAuthRefreshTokens', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    refreshToken: DataTypes.STRING(256),
    expiresAt: DataTypes.DATE,
    scope: DataTypes.STRING
  }, {
    tableName: 'oauth_refresh_tokens',
    timestamps: false,
    classMethods: {
      associate: function associate (models) {
        OAuthRefreshTokens.belongsTo(models.OAuthClients, {
          foreignKey: 'oauthClientId'
        })

        OAuthRefreshTokens.belongsTo(models.Users, {
          foreignKey: 'userId'
        })
      }
    }
  })

  return OAuthRefreshTokens
}
