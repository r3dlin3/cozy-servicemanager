var os = require('os');
var printit = require('printit');
var spawn = require('child_process').spawn;
var readline = require('readline');
var log = printit({
    prefix: 'cozy-servicemanager',
    date: true
});

/**
 *
 * @constructor
 */
function ServiceManagerFactory () {

}

/**
 * @return a service Manager depending on the platform
 */
ServiceManagerFactory.prototype.createServiceManager = function() {
    log.info('platform = ' + os.platform());

    switch (os.platform()) {
        case 'win32':
            return new WindowsServiceManager();
        default:
            throw 'Platform unknown';
    }
};

var WindowsServiceManager = function () {
    this.getAll = function () {
        var services = [];
        var service = {};
        var proc = spawn('sc', [
            'query',
            'type=', 'service'
        ]);
        /*  Exemple of output of this command

         SERVICE_NAME: wuauserv
         DISPLAY_NAME: Windows Update
         TYPE               : 20  WIN32_SHARE_PROCESS
         STATE              : 4  RUNNING
         (STOPPABLE, NOT_PAUSABLE, ACCEPTS_PRESHUTDOWN)
         WIN32_EXIT_CODE    : 0  (0x0)
         SERVICE_EXIT_CODE  : 0  (0x0)
         CHECKPOINT         : 0x0
         WAIT_HINT          : 0x0

         SERVICE_NAME: wudfsvc
         DISPLAY_NAME: Windows Driver Foundation - Infrastructure de pilote mode-utilisa
         eur
         TYPE               : 20  WIN32_SHARE_PROCESS
         STATE              : 4  RUNNING
         (NOT_STOPPABLE, NOT_PAUSABLE, IGNORES_SHUTDOWN)
         WIN32_EXIT_CODE    : 0  (0x0)
         SERVICE_EXIT_CODE  : 0  (0x0)
         CHECKPOINT         : 0x0
         WAIT_HINT          : 0x0

         */
        readline.createInterface({
            input: proc.stdout,
            terminal: false
        }).on('line', function (line) {
            log.debug(line);
            if (/^SERVICE_NAME: (.*)/.test(line)) {
                var val = RegExp.$1
                log.debug('Service : ' +val );
                service = {name: val};
            } else if (/^DISPLAY_NAME: (.*)/.test(line)) {
                var val = RegExp.$1
                log.debug('displayName : ' + val);
                service.displayName = val;
            } else if (/^\s*STATE\s*: (\d)/.test(line)) {
                var val = RegExp.$1
                log.debug('Status : ' + val);
                service.status = val;

                // last attribute we want, we push it to the array services
                services.push(service);
            }

            // skip everything else

        });
    }
};

module.exports = ServiceManagerFactory