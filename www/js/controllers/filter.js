angular.module('hotvibes.controllers')

    .controller('UsersFilterCtrl', function($scope, __, Country, CityPicker) {
        $scope.countries = Country.query();

        var range = function(min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) input.push(i);
            return input;
        };

        $scope.ages = range(18, 99);
        $scope.genders = ['male', 'female'];
        $scope.toggleGender = function($index) {
            $scope.currUser.filter.gender.toggleElement($scope.genders[$index]);
        };

        new CityPicker({
            getCountry: function() {
                return $scope.currUser.filter.country;
            },
            onCitySelected: function(city) {
                $scope.currUser.filter.cityId = city.id;
                $scope.currUser.filter.cityName = city.label;
            }
        }).then(function(modal) {
                $scope.cityPicker = modal;
            });
    });