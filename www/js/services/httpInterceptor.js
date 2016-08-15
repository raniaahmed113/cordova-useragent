angular.module('hotvibes.services')

    .service('HttpInterceptor', function($rootScope, $window, $q, $translate, AuthService, Config) {
        this.request = function(config) {
            if (config.url.startsWith(Config.API_URL_BASE)) {
                config.headers['Accept-Language'] = $translate.use();

                var accToken = AuthService.getAccessToken();

                if (accToken != null) {
                    config.headers['Authorization'] = 'Bearer ' + accToken;

                    if (!config.headers['DPR']) {
                        config.headers['DPR'] = $window.devicePixelRatio;
                        config.headers['Viewport-Width'] = $window.innerWidth;
                    }
                }
            }

            return config;
        };

        this.responseError = function(response) {
            switch (response.status) {
                case 401: // Unauthorized
                    $rootScope.$broadcast('authTokenExpired');
                    break;
            }

            return $q.reject(response);
        };
    });
