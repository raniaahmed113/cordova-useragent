angular.module('hotvibes.config', [])

    .constant('Config', {
        API_URL_BASE: 'http://api.flirtas.dev/',
        API_CLIENT_ID: $apiClientId,
        LANGUAGES: $languages,
        FB_APP_ID: $fbAppId
    });
