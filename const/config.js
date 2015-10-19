angular.module('hotvibes.config', [])

    .constant('Config', {
        // @if ENV == 'DEVELOPMENT'
        API_URL_BASE: 'http://vertex-flirtas-api-jm.vagrantshare.com/',
        // @endif
        // @if ENV == 'PRODUCTION'
        API_URL_BASE: 'https://api.flirtas.lt/',
        // @endif
        API_CLIENT_ID: 1
    });