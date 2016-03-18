/**
 * wembedImage
 *
 * @module      :: Model
 * @description :: wembed image model
 *
 */

module.exports = function (we) {
  var model = {
    definition: {
      name: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      size: {
        type: we.db.Sequelize.INTEGER,
        allowNull: false
      },

      active: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: true
      },

      originalFilename: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },

      mime: {
        type: we.db.Sequelize.STRING
      },

      extension: {
        type: we.db.Sequelize.STRING
      },

      width: {
        type: we.db.Sequelize.STRING
      },

      orderNumber: {
        type: we.db.Sequelize.STRING
      },

      height: {
        type: we.db.Sequelize.STRING
      }
    },
    associations: {
      wembed: {
        type: 'belongsTo',
        model: 'wembed'
      }
    },
    options: {
      // title field, for default title record pages
      titleField: 'title',

      classMethods: {
        getStyleUrlFromImage: function getStyleUrlFromImage(image) {
          return {
            original: we.config.hostname + '/public/project/wembed/images/'+
              image.wembedId+
              '/' + image.name + '.' + image.extension
          };
        }
      },
      instanceMethods: {
        toJSON: function toJSON() {
          var obj = this.get();
          obj.urls = we.db.models.wembedImage.getStyleUrlFromImage(obj);
          return obj;
        },
      },
      hooks: {
        beforeCreate: function beforeCreate(record, opts, done) {
          record.cacheTime = new Date();
          done();
        }
      }
    }
  };

  return model;
};