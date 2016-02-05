angular.module('hotvibes.controllers')

    .controller('LoginCtrl', function(
        $window, $scope, $state, $ionicModal, $ionicLoading, $ionicPopup, $translate, $cordovaFacebook,
        __, AuthService, DataMap, Config, Api, ErrorCode
    ) {
        var pixelDensitySuffix = '';

        if ($window.devicePixelRatio) {
            if ($window.devicePixelRatio >= 1.5 && $window.devicePixelRatio < 2.5) {
                pixelDensitySuffix = '@2x';

            } else if ($window.devicePixelRatio >= 2.5) {
                pixelDensitySuffix = '@3x';
            }
        }

        $scope.logoVariant = "logo-" + Config.API_CLIENT_ID + pixelDensitySuffix;

        $scope.loginData = {};
        $scope.login = function() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            AuthService.doLogin($scope.loginData.username, $scope.loginData.password).then(
                function() {
                    $state.go('inside.users').then(function() {
                        $ionicLoading.hide();
                        delete $scope.loginData.password;
                    });
                },

                function(error) {
                    $ionicLoading.hide();
                    $ionicPopup.alert({
                        title: __("Something's wrong"),
                        template: Api.translateErrorCode(error.code ? error.code : 0)
                    });
                }
            );
        };

        $scope.loginWithFb = function() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            function onError(errCode) {
                $ionicLoading.hide();

                $ionicPopup.alert({
                    title: __("Something's wrong"),
                    template: Api.translateErrorCode(errCode)
                });
            }

            $cordovaFacebook.login([ 'user_birthday', 'user_location' ]).then(
                function(response) {
                    if (response.status != 'connected') {
                        // Ignore
                        return;
                    }

                    AuthService.loginWithFb(response.authResponse.accessToken).then(
                        function() {
                            $state.go('inside.users').then(function() {
                                $ionicLoading.hide();
                                delete $scope.loginData.password;
                            });
                        },
                        function(error) {
                            onError(error.code);
                        }
                    );
                },
                onError
            );
        };

        $scope.countries = DataMap.country;
        $scope.language = $translate.use();
        $scope.rules = {};

        $scope.registration = {
            data: {
                clientId: Config.API_CLIENT_ID
            }, // FIXME: pre-fill country & email?

            submit: function() {
                $ionicLoading.show();

                // Submit request
                AuthService.submitRegistration(this.data)
                    .success(function(response, status, headers, config) {
                        $ionicLoading.hide();

                        // Success! Let's login now
                        $scope.loginData = {
                            username: $scope.registration.data.nickName,
                            password: $scope.registration.data.password
                        };
                        $scope.registration.modal.hide().then(function() {
                            $scope.registration.data = {};
                        });
                        $scope.login();

                    }).error(function(response, status, headers, config) {
                        $ionicLoading.hide();

                        if (
                                status == 400 /* Bad Request*/ 
                                && response.rule 
                                && response.rule.field
                                && $scope.registration.form['registration.data.' + response.rule.field]
                        ) {
                            // TODO: handle cases where such email is already registered (ErrorCode.EMAIL_ALREADY_TAKEN) - show password recovery screen or smth
                            var field = $scope.registration.form['registration.data.' + response.rule.field];
                            field.errorMessage = response.message;
                            field.$validators.serverError = function() { return true; }; // This will reset 'serverError' when value changes
                            field.$setValidity('serverError', false);

                        } else {
                            $ionicPopup.alert({
                                title: __("Something's wrong"),
                                template: Api.translateErrorCode(response.code)
                            });
                        }
                    });
            }
        };

        $ionicModal
            .fromTemplateUrl('templates/register.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.registration.modal = modal;
            });

        $ionicModal
            .fromTemplateUrl('templates/rules.html', {
                scope: $scope,
                animation: 'slide-in-left'
            })
            .then(function(modal) {
                $scope.rules.modal = modal;
            });
    });