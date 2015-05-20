angular.module('hotvibes.models', ['ngResource'])

    .factory('User', function($resource, Config) {
        return $resource(Config.hostApi + '/users/:id');
    });