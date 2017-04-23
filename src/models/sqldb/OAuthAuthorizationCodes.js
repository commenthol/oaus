module.exports = function (sequelize, DataTypes) {
  const OAuthAuthorizationCodes = sequelize.define('OAuthAuthorizationCodes', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    authorizationCode: DataTypes.STRING(256),
    expiresAt: DataTypes.DATE,
    redirectUri: DataTypes.STRING(2000),
    scope: DataTypes.STRING
  }, {
    tableName: 'oauth_authorization_codes',
    timestamps: false,
    classMethods: {
      associate: function associate (models) {
        OAuthAuthorizationCodes.belongsTo(models.OAuthClients, {
          foreignKey: 'oauthClientId'
        })

        OAuthAuthorizationCodes.belongsTo(models.Users, {
          foreignKey: 'userId'
        })
      }
    }
  })

  return OAuthAuthorizationCodes
}
