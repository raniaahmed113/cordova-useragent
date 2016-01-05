angular.module('hotvibes.controllers')

    .controller('UsersFilterCtrl', function($scope, __, DataMap, CityPicker) {
        $scope.countries = DataMap.country;

        var range = function(min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) input.push(i);
            return input;
        };

        $scope.ages = range(18, 99);
        $scope.genders = ['male', 'female'];

        new CityPicker({
            getCountry: function() {
                return $scope.currUser.filter.country;
            },
            onCitySelected: function(city) {
                $scope.currUser.filter.cityId = city.id;
                $scope.currUser.filter.city = city.label;
            }
        }).then(function(modal) {
            $scope.cityPicker = modal;
        });
    });