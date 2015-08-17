(function () {

    angular
        .module('app.services')
        .controller('svcController', [
            'svcService','favoriteService', '$log', '$q', '$scope', '$mdToast',
            SvcController
        ]);

    function SvcController(svcService,favoriteService, $log, $q, $scope, $mdToast) {
        //////////////////
        // Initialization
        //////////////////
        // Load all services
        svcService
            .loadAllServices()
            .then(function (services) {
                services.forEach(function (service) {
                    if (service.status === 'started') {
                        service.isStarted = true;
                    } else {
                        service.isStarted = false;
                    }
                });
                $scope.services = [].concat(services);
            });

        $scope.toggle = function (service) {
            if (service.status != undefined) {
                if (service.status === 'started') {
                    service.status = 'stopped';
                } else if (service.status === 'stopped') {
                    service.status = 'started';
                }
                svcService
                    .update(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Service is now ' + service.status)
                                .hideDelay(3000)
                        );
                    })

            }
        }
        $scope.toggleFavorite = function (service) {
            if (service.isFavorite === true) {
                service.isFavorite = false;
                favoriteService
                    .delete(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Service is deleted from favorites')
                                .hideDelay(3000)
                        );
                    });
            } else {
                service.isFavorite = true;
                favoriteService
                    .add(service)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .content('Service is added to favorites')
                                .hideDelay(3000)
                        );
                    });
            }


        }
    }
})
();