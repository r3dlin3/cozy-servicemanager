var os = require('os');
var fs = require('fs');
var path = require('path');
var printit = require('printit');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var readline = require('readline');
var Q = require('q');
var log = printit({
    prefix: 'cozy-servicemanager',
    date: true
});

var STATUS_STARTED = 'started';
var STATUS_STOPPED = 'stopped';
var STATUS_UNKNOWN = 'unknown';

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
        case 'linux':
            return new LinuxServiceManager();
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
};

WindowsServiceManager.prototype.getAll = function (callback) {
    var services = [];
    var service = {};
    var proc = spawn('sc', [
        'query',
        'type=', 'service',
        'state=', 'all'
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
        var val;
        if (/^SERVICE_NAME: (.*)/.test(line)) {
            val = RegExp.$1;
            log.debug('Service : ' + val);
            service = {name: val};
        } else if (/^DISPLAY_NAME: (.*)/.test(line)) {
            val = RegExp.$1;
            log.debug('displayName : ' + val);
            service.displayName = val;
        } else if (/^\s*STATE\s*: (\d)/.test(line)) {
            val = RegExp.$1;
            log.debug('Status : ' + val);
            service.status = WindowsServiceManager.prototype.mapStatus(val);

            // last attribute we want, we push it to the array services
            services.push(service);
        }

        // skip everything else

    }).on('close', function () {
        callback(services.slice(0, 2));
    });


};

WindowsServiceManager.prototype.getDetails = function (name, callback) {
    WindowsServiceManager.prototype._getService(name, function (service, err) {
        if (err) {
            callback(null, err);
            return;
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
        var val;
        if (/^DISPLAY_NAME: (.*)/.test(line)) {
            val = RegExp.$1;
            log.debug('displayName : ' + val);
            service.displayName = val;
        } else if (/^\s*STATE\s*: (\d)/.test(line)) {
            val = RegExp.$1;
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
        } else if (/^\s*DISPLAY_NAME\s*: (.*)/.test(line)) {
            val = RegExp.$1;
            service.displayName = val;
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
        if (err) {
            callback(null, err);
            return;
        }
        if (!service) {
            callback(null, "Service unknown");
            return;
        }

        if (service.status === STATUS_STARTED) {
            log.info("Service " + name + " is already started");
            callback(null);
            return;
        }
        var cmd = 'net start "' + name + '"';
        log.debug('cmd to execute: ', cmd);

        exec(cmd, function (err, stdout, stderr) {
            if (err) {
                callback(err);
            }
            else {
                log.info('Service', name, 'started');
                callback(null);
            }
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
        var cmd = 'net stop "' + name + '"';
        log.debug(cmd);

        exec(cmd, function (err, stdout, stderr) {
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
};


function LinuxServiceManager() {

}
LinuxServiceManager.prototype.mapStatus = function (state) {
    switch (state) {
        case 0:
            return STATUS_STARTED;
        case 1:
        case 2:
        case 3:
            return STATUS_STOPPED;
        case 4:
            return STATUS_UNKNOWN;
        default:
            throw "Unknown status " + state;
    }
};

LinuxServiceManager.prototype.getAll = function (callback) {
    var services = [];
    var service = {};
    var proc = spawn('service', [
        '--status-all',
    ]);
    /*  Exemple of output of this command

     [ ? ]  checkfs.sh
     [ ? ]  checkroot-bootclean.sh
     [ - ]  checkroot.sh
     [ - ]  console-setup
     [ + ]  cron

     */

    readline.createInterface({
        input: proc.stdout,
        terminal: false
    }).on('line', function (line) {
        log.debug(line);

        if (/\[\s+(.*)\s+\]\s+(.*)/.test(line)) {
            var status = RegExp.$1;
            var name = RegExp.$2;
            log.debug('Service : ' + name);
            log.debug('Status : ' + status);
            service = {name: name};
            switch (status){
                case "-":
                    service.status = STATUS_STOPPED;
                    break;
                case "+":
                    service.status = STATUS_STARTED;
                    break;
                case "?":
                    service.status = STATUS_UNKNOWN;
                    break;
                default:
                    callback(null, new Error('Unknown status'));
            }
            services.push(service);
        }

        // skip everything else

    }).on('close', function () {
        callback(services.slice(0, 2));
    });


};

LinuxServiceManager.prototype.getDetails = function (name, callback) {
    LinuxServiceManager.prototype._getStatus(name)
        .then(LinuxServiceManager.prototype._parseInitFile)
        .then(function (service) {
            callback(service, null);
        })
        .catch(function (error) {
            callback(null, error);
        });
};

LinuxServiceManager.prototype._parseInitFile = function (service) {
    var deferred = Q.defer();
    var initFile = path.join('/etc/init.d', service);
    var input = fs.createReadStream(initFile);

    /**
     From /etc/init.d/skeleton :

     # Provides:          skeleton
     # Required-Start:    $remote_fs $syslog
     # Required-Stop:     $remote_fs $syslog
     # Default-Start:     2 3 4 5
     # Default-Stop:      0 1 6
     # Short-Description: Example initscript
     # Description:       This file should be used to construct scripts to be
     #                    placed in /etc/init.d.

     */
    readline.createInterface({
        input: input,
        terminal: false
    }).on('line', function (line) {
        if (/Short-Description:\s+(.*)/.test(line)) {
            var desc = RegExp.$1;
            service.displayName=desc;
        }
        // skip everything else
    }).on('close', function () {
        deferred.resolve(service);
    });
};

/**
 * Wrapper around promise to execute a command and resolve/return the exit
 * code status
 * @param cmd
 * @return {!promise.Promise.<T>}
 * @private
 */
LinuxServiceManager.prototype._getExitCode = function (cmd) {
    log.info("Executing", cmd);
    var deferred = Q.defer();
    exec(cmd, function (err, stdout, stderr) {

    }).on('exit', function (code, signal) {
        // only interesting in the exit code!
        console.debug("Status exit code for'", cmd, "'=", code);

        deferred.resolve(code);
    });

    return deferred.promise;
}

/**
 *
 * @param name
 * @return a promise which resolve a JSON structure wih name and status
 * properties
 * @private
 */
LinuxServiceManager.prototype._getStatus = function (name) {
    log.debug('Getting status for', name);
    var cmd = 'service ' + name + ' status';
    log.info("Executing", cmd);
    return LinuxServiceManager.prototype._getExitCode(cmd)
        .then(function (code) {
            var service = {
                name: name,
                status: LinuxServiceManager.prototype.mapStatus(code)
            };

            return service;
        }
    )

};

LinuxServiceManager.prototype.start = function (name, callback) {
    log.debug('Starting ' + name);
    LinuxServiceManager.prototype._getStatus(name)
        .then(function (service) {
            if (service.status === STATUS_STARTED) {
                log.info("Service " + name + " is already started");
                callback(null);
                return;
            }
            var cmd = 'sudo service "' + name + '" start';
            LinuxServiceManager.prototype._getExitCode(cmd)
                .then(function (code) {
                    if (code != 0) {
                        callback(null, new Error("Could not start " + name));
                    } else {
                        log.info('Service', name, 'started');
                        callback(null);
                    }
                });

        })
        .catch(function (error) {
            callback(null, error);
        });
};

LinuxServiceManager.prototype.stop = function (name, callback) {
    log.debug('Stopping ' + name);
    LinuxServiceManager.prototype._getStatus(name)
        .then(function (service) {
            if (service.status === STATUS_STOPPED) {
                log.info("Service " + name + " is already stopped");
                callback(null);
                return;
            }
            var cmd = 'sudo service "' + name + '" stop';
            LinuxServiceManager.prototype._getExitCode(cmd)
                .then(function (code) {
                    if (code != 0) {
                        callback(null, new Error("Could not start " + name));
                    } else {
                        log.info('Service', name, 'stopped');
                        callback(null);
                    }
                });

        })
        .catch(function (error) {
            callback(null, error);
        });
};

module.exports = ServiceManagerFactory;