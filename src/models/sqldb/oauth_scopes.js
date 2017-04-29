/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('oauth_scopes', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    scope: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: true
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
    tableName: 'oauth_scopes',
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    timestamps: true
  })
}
