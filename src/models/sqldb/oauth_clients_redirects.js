/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_clients_redirects', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    redirectUri: {
      type: DataTypes.STRING(2000) + ' COLLATE utf8_bin',
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'oauth_clients_redirects',
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    timestamps: true
  })
}
