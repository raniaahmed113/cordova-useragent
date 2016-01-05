angular.module('hotvibes.filters', [])

    .filter('capitalizeFirst', function() {
        return function(input) {
            return input[0].toUpperCase() + input.substring(1);
        }
    })

    .filter('concat', function() {
        return function(inputArray, separator) {
            if (!inputArray || !angular.isArray(inputArray)) {
                return inputArray;
            }

            if (!separator) {
                separator = ', ';
            }

            return inputArray.join(separator);
        }
    })

    .filter('profilePhotoUrl', function() {
        return function(photo, gender) {
            if (photo && photo.url) {
                return photo.url;
            }

            if (!gender || gender == 'male') {
                gender = 'generic';
            }

            return 'img/person-' + gender + '.png';
        }
    })

    .filter('translateProfileVal', function(DataMap, $translate) {
        var translateProfileVal = function(value, mapId) {
            if (angular.isObject(value)) {
                return Object.keys(value).map(function(element) {
                    return translateProfileVal(element, mapId);
                });
            }

            return DataMap[mapId][value]
                ? $translate.instant(DataMap[mapId][value])
                : value;
        };

        return translateProfileVal;
    });