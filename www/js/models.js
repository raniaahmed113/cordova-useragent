angular.module('hotvibes.models', ['ngResource', 'hotvibes.config'])

    .factory('User', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'users/:id', { id: '@id' });
    })

    .factory('Guest', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/guests');
    })

    .factory('Conversation', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/conversations/:withUserId', { withUserId: '@id' });
    })

    .factory('Message', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/conversations/:withUserId/messages');
    })

    .factory('Request', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/requests');
    });