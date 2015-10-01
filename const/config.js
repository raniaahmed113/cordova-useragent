angular.module('hotvibes.config', [])

    .constant('Config', {
        // @if ENV == 'DEVELOPMENT'
        API_URL_BASE: 'http://api.flirtas.office.lithit.lt:11050/',
        // @endif
        // @if ENV == 'PRODUCTION'
        API_URL_BASE: 'https://api.flirtas.lt/',
        // @endif
        API_CLIENT_ID: 1
    });