angular.module('hotvibes.controllers')

    .controller('LoginCtrl', function(
        $window, $scope, $state, $ionicActionSheet, $ionicModal, $ionicLoading, $ionicPopup, $cordovaFacebook,
        __, AuthService, Config, Api, ErrorCode
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

        function onError(message) {
            $ionicPopup.alert({
                title: __("Something's wrong"),
                template: message
            });
        }

        function onLoggedIn() {
            $state.go('inside.users');
        }

        $scope.loginWithFb = function() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            $cordovaFacebook.login([ 'user_birthday', 'user_location' ]).then(
                function(response) {
                    if (response.status != 'connected') {
                        // Ignore
                        return;
                    }

                    AuthService.loginWithFb(response.authResponse.accessToken)
                        .then(
                            onLoggedIn,
                            function(error) {
                                onError(Api.translateErrorCode(error.code));
                            }
                        ).finally(function() {
                            $ionicLoading.hide();
                        });
                },
                function(error) {
                    $ionicLoading.hide();

                    if (error.errorCode == '4201') {
                        // Login cancelled by the user - do nothing
                        return;
                    }

                    onError();
                }
            );
        };

        function requestInputPhoneNumber() {
            $ionicPopup.prompt({
                title: __('Login with phone number'),
                template: __('Enter number'),
                inputType: 'tel',
                inputPlaceholder: __('Phone number'),
                buttons: [
                    {
                        text: __('Cancel'),
                        type: 'button-default'
                    },
                    {
                        text: __('Continue'),
                        type: 'button-positive',
                        onTap: function(e) {
                            // Do not auto-close the pop-up
                            e.preventDefault();

                            var self = this,
                                phoneNumber = this.scope.$parent.data.response;

                            if (!phoneNumber) {
                                return;
                            }

                            $ionicLoading.show({ template: __("Please wait") + '..' });
                            AuthService.sendConfirmationCode(phoneNumber)
                                .then(
                                    function() {
                                        self.hide();
                                        requestInputSmsCode(phoneNumber)
                                    },
                                    function(error) {
                                        var message;

                                        switch (error.code) {
                                            case ErrorCode.INVALID_INPUT:
                                                message = __("Incorect phone number.");
                                                break;

                                            default:
                                                message = Api.translateErrorCode(error.code);
                                                break;
                                        }

                                        onError(message);
                                    }
                                )
                                .finally(function () {
                                    $ionicLoading.hide();
                                });
                        }
                    }
                ]
            });
        }

        function register(phoneNumber, smsCode) {
            // __('Fantastic, you're re nearly there. We just need couple more things')
        }

        function requestInputSmsCode(phoneNumber) {
            $ionicPopup.prompt({
                title: __('Confirm your number'),
                template: __('Confirm code has been sent!'),
                inputType: 'number',
                inputPlaceholder: __('Code'),
                buttons: [
                    {
                        text: __('Cancel'),
                        type: 'button-default'
                    },
                    {
                        text: __('Check code'),
                        type: 'button-positive',
                        onTap: function(e) {
                            // Do not auto-close the pop-up
                            e.preventDefault();

                            var self = this,
                                smsCode = this.scope.$parent.data.response;

                            if (!smsCode) {
                                return;
                            }

                            $ionicLoading.show({ template: __("Please wait") + '..'});
                            AuthService.loginWithSmsCode(phoneNumber, smsCode)
                                .then(
                                    function() {
                                        self.hide();
                                        onLoggedIn();
                                    },
                                    function(error) {
                                        var message;

                                        if (error.code == ErrorCode.INVALID_CREDENTIALS) {
                                            // No account found associated with this phone number: proceed to registration
                                            self.hide();
                                            register(phoneNumber, smsCode);
                                            return;
                                        }

                                        switch (error.code) {
                                            case ErrorCode.INVALID_INPUT:
                                                message = __("Unable to confirm phone");
                                                break;

                                            default:
                                                message = Api.translateErrorCode(error.code);
                                                break;
                                        }

                                        onError(message);
                                    }
                                )
                                .finally(function() {
                                    $ionicLoading.hide();
                                });
                        }
                    }
                ]
            });
        }

        $scope.showAltLoginMethods = function() {
            $ionicActionSheet.show({
                buttons: [
                    { text: __('Login with phone number') },
                    { text: __('Login with username/email') }
                ],
                titleText: __('Alternative login methods'),
                cancelText: __('Cancel'),
                buttonClicked: function(index) {
                    switch (index) {
                        case 0: // Phone number
                            requestInputPhoneNumber();
                            break;

                        case 1: // Email
                            $scope.loginWithPassword.modal.show();
                            break;
                    }

                    return true;
                }
            });
        };

        $scope.loginWithPassword = {};
        $ionicModal
            .fromTemplateUrl('templates/login_password.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.loginWithPassword.modal = modal;
            });

        /*$scope.loginData = {};
        $scope.login = function() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            AuthService.loginWithCredentials($scope.loginData.username, $scope.loginData.password)
                .then(
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
                                status == 400 // Bad Request
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
            });*/
    });