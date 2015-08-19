/* See documentation on
 https://github.com/cozy/cozy-db */

var cozydb = require('cozydb');

module.exports = {
    favorite: {
        // shortcut for emit doc._id, doc
        all: cozydb.defaultRequests.all,

    }
};
