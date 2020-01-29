/**
 * wembed
 *
 * @module      :: Model
 * @description :: wembed model
 *
 */

module.exports = function (we) {
  const model = {
    definition: {
      url: {
        type: we.db.Sequelize.STRING(2500),
        allowNull: false
      },

      domain: {
        type: we.db.Sequelize.STRING(1000),
        allowNull: false
      },

      cacheTime: {
        type: we.db.Sequelize.DATE,
        allowNull: false
      },

      title: {
        type: we.db.Sequelize.STRING(1500)
      },

      description: {
        type: we.db.Sequelize.TEXT
      },

      // youtube, vimeo ... wikipedia
      provider: {
        type: we.db.Sequelize.STRING
      },

      pageType: {
        type: we.db.Sequelize.STRING
      }
    },
    associations: {
      images: {
        type: 'hasMany',
        model: 'wembedImage'
      }
    },
    options: {
      // title field, for default title record pages
      titleField: 'title',
      enableAlias: false,
      tableName: 'wembeds',

      classMethods: {},
      instanceMethods: {},
      hooks: {
        beforeCreate(record) {
          record.cacheTime = new Date();
        }

      }
    }
  };

  return model;
};