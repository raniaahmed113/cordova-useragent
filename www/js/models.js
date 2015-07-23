angular.module('hotvibes.models', ['ngResource'])

    .factory('User', function($resource) {
        return $resource('/api/users/:id');
    })

    .factory('Conversation', function($resource) {
        return $resource('/api/users/:ownerId/conversations/:withUserId');
    });