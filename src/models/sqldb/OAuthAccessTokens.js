module.exports = function (sequelize, DataTypes) {
  const OAuthAccessTokens = sequelize.define('OAuthAccessTokens', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    accessToken: DataTypes.STRING(256),
    expiresAt: DataTypes.DATE,
    scope: DataTypes.STRING
  }, {
    tableName: 'oauth_access_tokens',
    timestamps: false,
    classMethods: {
      associate: function (models) {
        OAuthAccessTokens.belongsTo(models.OAuthClients, {
          foreignKey: 'oauthClientId'
        })

        OAuthAccessTokens.belongsTo(models.Users, {
          foreignKey: 'userId'
        })
      }
    }
  })

  return OAuthAccessTokens
}
