angular.module('hotvibes.controllers')

    .controller('LoginCtrl', function(
        $window, $scope, $state, $ionicActionSheet, $ionicModal, $ionicLoading, $ionicPopup, $cordovaFacebook, $translate,
        __, AuthService, Config, Api, ErrorCode, DataMap, Rule
    ) {
        $scope.logoVariant = Config.API_CLIENT_ID;

        function onError(message) {
            return $ionicPopup.alert({
                title: __("Something's wrong"),
                template: message
            });
        }

        $scope.prompt = {};

        function promptForMoreInfo(fieldName) {
            var subTitle, inputType;

            switch (fieldName) {
                case 'email':
                    subTitle = __('Please enter valid e-mail') + ':';
                    inputType = 'email';
                    break;

                case 'birthday':
                    subTitle = __('Please provide your birthday, it is required in order to register.');
                    inputType = 'date';
                    break;
            }

            $ionicPopup.prompt({
                title: __("Fantastic, you're re nearly there. We just need couple more things"),
                subTitle: subTitle,
                inputType: inputType,
                buttons: [
                    {
                        text: __('Cancel'),
                        type: 'button-default'
                    },
                    {
                        text: __('Continue'),
                        type: 'button-positive',
                        onTap: function (e) {
                            // Do not auto-close the pop-up
                            e.preventDefault();

                            var value = this.scope.$parent.data.response;
                            if (!value) {
                                return;
                            }

                            $scope.prompt[fieldName] = value;
                            this.hide();

                            $scope.loginWithFb();
                        }
                    }
                ]
            });
        }

        function onLoggedIn() {
            $state.go('inside.users');
        }

        $scope.loginWithFb = function() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            $cordovaFacebook.login([ 'email', 'user_birthday', 'user_location' ]).then(
                function(response) {
                    if (response.status != 'connected') {
                        // Ignore
                        return;
                    }

                    AuthService.loginWithFb(response.authResponse.accessToken, $scope.prompt.birthday, $scope.prompt.email)
                        .then(
                            onLoggedIn,
                            function(error) {
                                if (error && error.rule) {
                                    switch (error.rule.type) {
                                        case Rule.IS_EMAIL_VALID:
                                            onError(__("This e-mail address is invalid"))
                                                .then(function() {
                                                    promptForMoreInfo(error.rule.field)
                                                });
                                            return;

                                        case Rule.IS_DATE_VALID:
                                            onError(__("Incorrect birthday."))
                                                .then(function() {
                                                    promptForMoreInfo(error.rule.field)
                                                });
                                            return;
                                    }

                                    promptForMoreInfo(error.rule.field);
                                    return;
                                }

                                onError(Api.translateErrorCode(error ? error.code : 0));
                            }
                        ).finally(function() {
                            $ionicLoading.hide();
                        });
                },
                function(error) {
                    $ionicLoading.hide();

                    if (error.errorCode == '4201' /* Login cancelled by the user */) {
                        // Do nothing
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
                                                message = Api.translateErrorCode(error? error.code : 0);
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
                                                message = Api.translateErrorCode(error ? error.code : 0);
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
                    //{ text: __('Login with phone number') },
                    { text: __('Login with username/email') }
                ],
                titleText: __('Alternative login methods'),
                cancelText: __('Cancel'),
                buttonClicked: function(index) {
                    switch (index) {
                        // case 0: // Phone number
                        //     requestInputPhoneNumber();
                        //     break;

                        case 0: // Email
                            $scope.loginWithPassword.modal.show();
                            break;
                    }

                    return true;
                }
            });
        };

        $scope.loginWithPassword = {
            data: {},
            submit: function() {
                $ionicLoading.show({ template: __("Please wait") + '..'});

                AuthService.loginWithCredentials($scope.loginWithPassword.data.username, $scope.loginWithPassword.data.password)
                    .then(
                        function() {
                            onLoggedIn();
                            $scope.loginWithPassword.modal.hide();
                            delete $scope.loginWithPassword.data.password;
                        },

                        function(error) {
                            onError(Api.translateErrorCode(error ? error.code : 0));
                        }
                    ).finally(function() {
                        $ionicLoading.hide();
                    });
            }
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
                                template: Api.translateErrorCode(response ? response.code : 0)
                            });
                        }
                    });
            }
        };

        function register(phoneNumber, smsCode) {
            $scope.registration.data.phoneNumber = phoneNumber;
            $scope.registration.data.smsCode = smsCode;
            $scope.registration.modal.show();
        }

        $ionicModal
            .fromTemplateUrl('templates/login_password.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.loginWithPassword.modal = modal;
            });

        $ionicModal
            .fromTemplateUrl('templates/register.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.registration.modal = modal;
                //modal.show();
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