angular.module('hotvibes.config', [])

    .constant('Config', {
        API_URL_BASE: 'https://api.flirtas.lt/',
        API_CLIENT_ID: $apiClientId,
        LANGUAGES: $languages
    });