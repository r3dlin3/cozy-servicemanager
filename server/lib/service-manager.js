var os = require('os');
var printit = require('printit');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var readline = require('readline');
var log = printit({
    prefix: 'cozy-servicemanager',
    date: true
});
var async = require('async');

var STATUS_STARTED = 'started';
var STATUS_STOPPED = 'stopped';

/**
 *
 * @constructor
 */
function ServiceManagerFactory() {

}

/**
 * @return a service Manager depending on the platform
 */
ServiceManagerFactory.prototype.createServiceManager = function () {
    log.info('platform = ' + os.platform());

    switch (os.platform()) {
        case 'win32':
            return new WindowsServiceManager();
        default:
            throw 'Platform unknown';
    }
};

function WindowsServiceManager() {

}
WindowsServiceManager.prototype.mapStatus = function (state) {
    switch (state) {
        case "1":
            return STATUS_STOPPED;
        case "4":
            return STATUS_STARTED;

        default:
            throw "Unknown status " + state;
    }
    ;
};

WindowsServiceManager.prototype.getAll = function (callback) {
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
            log.debug('Service : ' + val);
            service = {name: val};
        } else if (/^DISPLAY_NAME: (.*)/.test(line)) {
            var val = RegExp.$1
            log.debug('displayName : ' + val);
            service.displayName = val;
        } else if (/^\s*STATE\s*: (\d)/.test(line)) {
            var val = RegExp.$1
            log.debug('Status : ' + val);
            service.status = WindowsServiceManager.prototype.mapStatus(val);

            // last attribute we want, we push it to the array services
            services.push(service);
        }

        // skip everything else

    }).on('close', function () {
        callback(services);
    });


};

WindowsServiceManager.prototype.getDetails = function (name, callback) {
    WindowsServiceManager.prototype._getService(name, function (service, err) {
        if (err) {
            callback(null, err);
        }
        WindowsServiceManager.prototype._getConfiguration(service, callback);
    });
};

WindowsServiceManager.prototype._getService = function (name, callback) {
    log.debug('_getService of ' + name);
    var service = {name: name};
    var proc = spawn('sc', [
        'query',
        //'"'+name+'"',
        name
    ]);
    /*  Exemple of output of this command

     SERVICE_NAME: MSSQL
     TYPE               : 10  WIN32_OWN_PROCESS
     STATE              : 1  STOPPED
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
        if (/^DISPLAY_NAME: (.*)/.test(line)) {
            var val = RegExp.$1
            log.debug('displayName : ' + val);
            service.displayName = val;
        } else if (/^\s*STATE\s*: (\d)/.test(line)) {
            var val = RegExp.$1
            log.debug('Status : ' + val);
            service.status = WindowsServiceManager.prototype.mapStatus(val);
        }
        // skip everything else

    }).on('close', function () {
        if (service.status === undefined) {
            callback(null, "Service unknown");
        } else {
            callback(service, null);
        }
    });
};
WindowsServiceManager.prototype._getConfiguration = function (service, callback) {
    var proc = spawn('sc', [
        'qc',
        //'"'+service.name+'"'
        service.name
    ]);
    /*  Exemple of output of this command

     SERVICE_NAME: wuauserv
     TYPE               : 20  WIN32_SHARE_PROCESS
     START_TYPE         : 3   DEMAND_START
     ERROR_CONTROL      : 1   NORMAL
     BINARY_PATH_NAME   : C:\windows\system32\svchost.exe -k netsvcs
     LOAD_ORDER_GROUP   :
     TAG                : 0
     DISPLAY_NAME       : Windows Update
     DEPENDENCIES       : rpcss
     SERVICE_START_NAME : LocalSystem

     */

    readline.createInterface({
        input: proc.stdout,
        terminal: false
    }).on('line', function (line) {
        log.debug(line);
        if (/^\s*START_TYPE\s*: (\d)/.test(line)) {
            var val = RegExp.$1
            log.debug('Start type : ' + val);
            switch (val) {
                case "4":
                    service.enable = false;
                    service.shouldBeStarted = false;
                    break;
                case "1":
                case "2":
                    service.enable = true;
                    service.shouldBeStarted = true;
                    break;
                case "3":
                    service.enable = true;
                    service.shouldBeStarted = false;
                    break;
                default:
                    callback(null, "Unknown START_TYPE");
                    return;

            }
        }
        // skip everything else

    }).on('close', function () {
        if (service.enable === undefined) {
            callback(null, "Service unknown");
            return;
        }
        callback(service, null);
    });
};

WindowsServiceManager.prototype.start = function (name, callback) {
    log.debug('Starting ' + name);
    WindowsServiceManager.prototype._getService(name, function (service, err) {
        if (err) callback(null, err);

        if (service.status === STATUS_STARTED) {
            log.info("Service " + name + " is already started");
            callback(null);
            return;
        }
        var cmd = 'net start "'+name+'"';
        log.debug('cmd to execure: ', cmd);

        var child = exec(cmd, function(err, stdout, stderr) {
            if (err) {
                callback(err);
            }
            else {
                log.info('Service', name, 'started');
                callback(null);
            }
            return;
        });

    });
}
WindowsServiceManager.prototype.stop = function (name, callback) {
    log.debug('Stopping ' + name);
    WindowsServiceManager.prototype._getService(name, function (service, err) {
        if (err) callback(null, err);

        if (service.status === STATUS_STOPPED) {
            log.info('Service', name, 'is already stopped');
            callback(null);
            return;
        }
        var cmd = 'net stop "'+name+'"';
        log.debug(cmd);

        var child = exec(cmd, function(err, stdout, stderr) {
            if (err) {
                callback(err);
            }
            else {
                log.info('Service', name, 'stopped');
                callback(null);
            }
            return;
        });

    });
}


module.exports = ServiceManagerFactory