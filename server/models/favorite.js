// See documentation on https://github.com/aenario/cozydb/

var cozydb = require('cozydb');

var FavoriteModel = cozydb.getModel('Favorite', {
    "name": String
});

module.exports = FavoriteModel;
