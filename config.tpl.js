angular.module('hotvibes.config', [])

    .constant('Config', {
        API_URL_BASE: 'https://api.hotvibes.com/',
        API_CLIENT_ID: $apiClientId,
        LANGUAGES: $languages
    });