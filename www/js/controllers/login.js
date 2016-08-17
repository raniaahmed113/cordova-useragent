angular.module('hotvibes.controllers')

    .controller('LoginCtrl', function (
        $window, $q, $scope, $state, $ionicActionSheet, $ionicModal, $ionicLoading, $ionicPopup, $translate,
        __, AuthService, Config, Api, ErrorCode, DataMap, Rule, $rootScope, $cordovaNetwork
    ) {
        var today = new Date(),
            ageMin = 18,
            ageMax = 99;

        $scope.internetConnected = true;
        $scope.logoVariant = Config.API_CLIENT_ID;
        $scope.prompt = {};
        $scope.countries = DataMap.country;
        $scope.language = $translate.use();
        $scope.rules = {};
        $scope.birthdayDateMin = new Date(today.getFullYear() - ageMax, today.getMonth(), today.getDate());
        $scope.birthdayDateMax = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
        $scope.loginWithFb = loginWithFb;
        $scope.loginWithPassword = {
            data: {},
            submit: loginWithPassword
        };
        $scope.loginWithPhone = {
            data: {},
            submit: loginWithPhone
        };
        $scope.registration = {
            data: {
                clientId: Config.API_CLIENT_ID
            }, // FIXME: pre-fill country & email?

            submit: submitRegistration
        };
        $scope.enterCode = {
            data: {}
        };
        $scope.showAltLoginMethods = function () {
            $ionicActionSheet.show({
                buttons: [
                    { text: "<div class='icon icon-device phone'></div>" +  __('Login with phone number') },
                    { text: "<div class='icon icon-mail email'></div>" +  __('Login with email') }
                ],
                buttonClicked: function (index) {
                    switch (index) {
                        case 0: // Phone number
                            $scope.loginWithPhone.modal.show();
                            break;

                        case 1: // Email
                            $scope.loginWithPassword.modal.show();
                            break;
                    }

                    return true;
                }
            });
        };

        listenForConnectivityChanges();
        setupModals();

        function loginWithPassword() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            AuthService.loginWithCredentials($scope.loginWithPassword.data.username, $scope.loginWithPassword.data.password)
                .then(
                    function () {
                        onLoggedIn();
                        $scope.loginWithPassword.modal.hide();
                        delete $scope.loginWithPassword.data.password;
                    },

                    function (error) {
                        onError(Api.translateErrorCode(error ? error.code : 0));
                    }
                ).finally($ionicLoading.hide);
        }

        function loginWithPhone() {
            var phoneNumber = $scope.loginWithPhone.data.phoneNumber;
            if (!phoneNumber) {
                return;
            }

            var numberData = /^(?:8|\+?370)(6\d{7})$/.exec(phoneNumber);
            if (numberData) {
                phoneNumber = "370" + numberData[1];
            }

            $ionicLoading.show({ template: __("Please wait") + '..'});

            AuthService.sendConfirmationCode(phoneNumber)
                .then(requestInputSmsCode, onFailedToSendCode)
                .finally($ionicLoading.hide);
        }

        function loginWithFb() {
            $ionicLoading.show({ template: __("Please wait") + '..'});

            AuthService.loginWithFb($scope.prompt.birthday, $scope.prompt.email)
                .then(
                    onLoggedIn,
                    function (error) {
                        if (error.errorCode == AuthService.ERROR_LOGIN_CANCELLED) {
                            // Do nothing
                            return;
                        }

                        if (error && error.rule) {
                            switch (error.rule.type) {
                                case Rule.IS_EMAIL_VALID:
                                    onError(__("This e-mail address is invalid"))
                                        .then(function () {
                                            promptForMoreInfo(error.rule.field)
                                        });
                                    return;

                                case Rule.IS_DATE_VALID:
                                    onError(__("Incorrect birthday."))
                                        .then(function () {
                                            promptForMoreInfo(error.rule.field)
                                        });
                                    return;

                                case Rule.NOT_EMPTY:
                                    promptForMoreInfo(error.rule.field);
                                    return;
                            }
                        }

                        onError(Api.translateErrorCode(error ? error.code : 0));
                    }
                ).finally($ionicLoading.hide);
        }

        function onLoggedIn() {
            $scope.loginWithPhone.modal.hide();
            $scope.loginWithPassword.modal.hide();
            $state.go('inside.users');
        }

        function onError(message) {
            // FIXME: log error

            return $ionicPopup.alert({
                title: __("Something's wrong"),
                template: message,
                cssClass: "on-error"
            });
        }

        function onFailedToSendCode(error) {
            var message;

            switch (error.data.code) {
                case ErrorCode.INVALID_INPUT:
                    message = __("Incorect phone number.");
                    break;

                default:
                    message = Api.translateErrorCode(error.data.code);
                    break;
            }

            onError(message);
        }

        function requestInputSmsCode(phoneNumber) {
            $scope.enterCode.submit = function () {
                var smsCode = $scope.enterCode.data.smsCode;
                if (!smsCode) {
                    return;
                }

                $ionicLoading.show({ template: __("Please wait") + '..'});

                AuthService.loginWithSmsCode(phoneNumber, smsCode)
                    .then(onLoggedIn, onSmsCodeLoginFailed)
                    .finally($ionicLoading.hide);
            };

            $ionicLoading.hide();

            $scope.loginWithPhone.modal.hide().then(function () {
                $scope.enterCode.modal.show();
            })
        }

        function onSmsCodeLoginFailed(error) {
            var message;

            switch (error.code) {
                case ErrorCode.INVALID_CREDENTIALS:
                    // No account found associated with this phone number: proceed to registration
                    register(phoneNumber, smsCode);
                    return;

                case ErrorCode.INVALID_INPUT:
                    message = __("Unable to confirm phone");
                    break;

                default:
                    message = Api.translateErrorCode(error.code);
                    break;
            }

            onError(message);
        }

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

        function register(phoneNumber, smsCode) {
            $scope.registration.data.phoneNumber = phoneNumber;
            $scope.registration.data.smsCode = smsCode;
            $scope.registration.modal.show();
        }

        function submitRegistration() {
            $ionicLoading.show();

            // Submit request
            AuthService.submitRegistration(this.data)
                .success(function (response, status, headers, config) {
                    $ionicLoading.hide();

                    // Success! Let's login now
                    $scope.loginWithPassword.data = {
                        username: $scope.registration.data.nickName,
                        password: $scope.registration.data.password
                    };

                    $scope.registration.modal.hide().then(function () {
                        $scope.registration.data = {};
                    });

                    $scope.loginWithPassword.submit();
                })
                .error(function (response, status, headers, config) {
                    $ionicLoading.hide();

                    if (
                        status === 400
                        && response.code === ErrorCode.INVALID_CREDENTIALS
                        && $scope.registration.data.phoneNumber
                    ) {
                        // Invalid SMS code
                        // Probably user took to long entering additional info and code has expired
                        $scope.registration.modal.hide();
                        requestInputSmsCode($scope.registration.data.phoneNumber);
                        return;
                    }

                    if (
                        status == 400 // Bad Request
                        && response.rule
                        && response.rule.field
                        && $scope.registration.form['registration.data.' + response.rule.field]
                    ) {
                        var field = $scope.registration.form['registration.data.' + response.rule.field],
                            validationMessage = response.message;

                        if (response.rule.field === "birthday" && response.rule.type === "age") {
                            validationMessage = __("Incorrect birthday.");
                        }

                        field.errorMessage = validationMessage;
                        field.$validators.serverError = function () { return true; }; // This will reset 'serverError' when value changes
                        field.$setValidity('serverError', false);

                    } else {
                        $ionicPopup.alert({
                            title: __("Something's wrong"),
                            template: Api.translateErrorCode(response ? response.code : 0)
                        });
                    }
                });
        }

        function setupModals() {
            $ionicModal
                .fromTemplateUrl('templates/login_password.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                })
                .then(function (modal) {
                    $scope.loginWithPassword.modal = modal;
                });

            $ionicModal
                .fromTemplateUrl('templates/login_phone.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                })
                .then(function (modal) {
                    $scope.loginWithPhone.modal = modal;
                });

            $ionicModal
                .fromTemplateUrl('templates/login_phone_code.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                })
                .then(function (modal) {
                    $scope.enterCode.modal = modal;
                });

            $ionicModal
                .fromTemplateUrl('templates/register.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                })
                .then(function (modal) {
                    $scope.registration.modal = modal;
                });

            $ionicModal
                .fromTemplateUrl('templates/rules.html', {
                    scope: $scope,
                    animation: 'slide-in-left'
                })
                .then(function (modal) {
                    $scope.rules.modal = modal;
                });
        }

        function listenForConnectivityChanges() {
            document.addEventListener("deviceready", function () {
                $scope.internetConnected = (navigator.connection.type !== Connection.NONE);

                $rootScope.$on('$cordovaNetwork:online', function () {
                    $scope.internetConnected = true;
                });

                $rootScope.$on('$cordovaNetwork:offline', function () {
                    $scope.internetConnected = false;
                })
            }, false);
        }
    });
