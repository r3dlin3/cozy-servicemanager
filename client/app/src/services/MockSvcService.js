(function () {
    'use strict';

    angular.module('app.services')
        .service('svcService', ['$q', SvcService]);

    /**
     * Services DataService
     * Uses embedded, hard-coded data model; acts asynchronously to simulate
     * remote data service call(s).
     *
     * @returns {{loadAll: Function}}
     * @constructor
     */
    function SvcService($q) {
        var services = [{
            "name": "AdobeARMservice",
            "displayName": "Adobe Acrobat Update Service",
            "status": "started"
        }, {
            "name": "AMD External Events Utility",
            "displayName": "AMD External Events Utility",
            "status": "stopped"
        }, {
            "name": "AppHostSvc",
            "displayName": "Application Host Helper Service",
            "status": "started",
            "isFavorite": true
        }, {
            "name": "Appinfo",
            "displayName": "Informations d'application",
            //"status": "started"
        }, {
            "name": "AppMgmt",
            "displayName": "Gestion d'applications",
            "status": "started"
        }
        ];

        // Promise-based API
        return {
            loadAllServices: function () {
                // Simulate async nature of real remote calls
                return $q.when(services);
            },
            update: function (service) {
                return $q.when(service);
            }
        };
    }

})();
