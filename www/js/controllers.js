angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function($scope, $state, authService) {
        $scope.logout = function() {
            authService.doLogout();
        };
    })

    .controller('LoginCtrl', function($scope, authService) {
        $scope.loginData = {};
        $scope.login = function() {
            authService.doLogin();
        };
    })

    .controller('UsersCtrl', function($scope, User) {
        /*$scope.newPerson = new Person({
            "name": "Mick Johnson",
            "email": "mick@example.com"
        });
        $scope.newPerson.$save();*/

        $scope.users = User.query();
    })

    .controller('UserCtrl', function($scope, $stateParams, User) {
        $scope.user = User.get({ id: $stateParams.id });
    });