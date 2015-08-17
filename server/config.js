var americano = require('americano');

module.exports = {
    common: {
        use: [
            americano.bodyParser(),
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
    ]
};