angular.module('hotvibes.config', [])

    .constant('Config', {
        API_URL_BASE: 'http://vertex-flirtas-api-jm.vagrantshare.com/',
        API_CLIENT_ID: $apiClientId,
        LANGUAGES: $languages
    });