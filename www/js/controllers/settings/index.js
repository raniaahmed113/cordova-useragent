angular.module('hotvibes.controllers')

    .controller('SettingsIndexCtrl', function($scope) {
        $scope.$watch('currUser.isInvisible', function (newValue, oldValue) {
            if (newValue === oldValue) {
                return;
            }

            $scope.currUser.$update({
                isInvisible: newValue
            });
        }, true);
    });
