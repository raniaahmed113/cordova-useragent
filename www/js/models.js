angular.module('hotvibes.models', ['ngResource', 'hotvibes.config'])

    .factory('User', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'users/:id', { id: '@id' });
    })

    .factory('Conversation', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'users/:ownerId/conversations/:withUserId', { ownerId: '@ownerId', withUserId: '@id' });
    })

    .factory('Message', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'users/:ownerId/conversations/:withUserId/messages');
    });