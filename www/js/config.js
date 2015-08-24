angular.module('hotvibes.config', [])

    .constant('Config', {
        API_URL_BASE: 'http://api.flirtas.office.lithit.lt:8585/',
        API_CLIENT_ID: 1
    })

    .constant('angularMomentConfig', {
        preprocess: 'unix', // optional
        timezone: 'Europe/London' // optional
    });