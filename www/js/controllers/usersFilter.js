angular.module('hotvibes.controllers')

    .controller('UsersFilterCtrl', function($scope, __, DataMap, CityPicker) {
        $scope.ages = range(18, 99);
        $scope.genders = ['male', 'female'];
        $scope.countries = DataMap.country;

        new CityPicker({
            currentSelection:
                $scope.currUser.filter && $scope.currUser.filter.city
                    ? {
                        id: $scope.currUser.filter.cityId,
                        label: $scope.currUser.filter.city
                    }
                    : null,
            getCountry: function() {
                return $scope.currUser.filter.country;
            },
            onCitySelected: function(city) {
                $scope.currUser.filter.cityId = city ? city.id : null;
                $scope.currUser.filter.city = city ? city.label : null;
            }
        }).then(function(modal) {
            $scope.cityPicker = modal;
        });
    });