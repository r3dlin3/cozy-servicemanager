var americano = require('americano');
var expressValidator = require('express-validator');

module.exports = {
    common: {
        use: [
            americano.bodyParser(),
            expressValidator(),
            americano.methodOverride(),
            americano.errorHandler({
                dumpExceptions: true,
                showStack: true
            }),
            americano.static(__dirname + '/../client/app', {
                maxAge: 86400000
            })
        ],
    },
    development: [
        americano.logger('dev')
    ],
    production: [
        americano.logger('short')
    ],
    plugins: [
        'cozydb'
    ]
};