angular.module('hotvibes.controllers')

    .controller('SettingsProfileCtrl', function(
        $scope, $ionicLoading, $ionicPopup, $q,
        __, PendingConfirmation, CityPicker, ErrorCode, DataMap
    ) {
        $scope.settings = angular.copy($scope.currUser);

        $scope.$watch('settings.country', function(newVal, oldVal) {
            if (newVal === oldVal) {
                return;
            }

            $scope.settings.city = '';
        });

        $scope.save = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            $scope.currUser.$update(
                FormUtils.getDirtyFields($scope.settings.form).settings

            ).then(
                function() {
                    if ($scope.settings.profile.phoneNumber !== $scope.currUser.profile.phoneNumber) {
                        $scope.currUser.profile.isPhoneNumberConfirmed = false;
                    }

                    if ($scope.settings.email !== $scope.currUser.email) {
                        $scope.currUser.profile.isEmailConfirmed = false;
                    }

                    $scope.settings.form.$setPristine();

                    $ionicLoading.show({
                        template: __('Saved'),
                        noBackdrop: true,
                        duration: 1000
                    });
                },

                function (error) {
                    if (error.status === 400 /* Bad Request */ && error.data.rule) {
                        // Validation error
                        switch (error.data.rule.field) {
                            case "phoneNumber":
                                $scope.settings.form['settings.profile.phoneNumber'].$setValidity("tel", false);

                                // Cancel invalid state of the field the next time it is edited
                                var stopWatching = $scope.$watch("settings.profile.phoneNumber", function (oldVal, newVal) {
                                    if (oldVal === newVal) {
                                        return;
                                    }

                                    stopWatching();
                                    $scope.settings.form['settings.profile.phoneNumber'].$setValidity("tel", true);
                                });

                                return;
                        }
                    }

                    $scope.onError(error);
                }

            ).finally(function() {
                $ionicLoading.hide();
            });
        };

        $scope.countries = DataMap.country;

        new CityPicker({
            getCountry: function() {
                return $scope.settings.country;
            },
            onCitySelected: function(city) {
                $scope.settings.city = city.label;
                $scope.settings.form['settings.city'].$setDirty();
            }
        }).then(function(modal) {
            $scope.modal = modal;
        });

        $scope.confirmPhone = function() {
            $scope.confirmPhonePrompt = { code: null };

            $ionicPopup.prompt({
                title: __('Confirm your phone number'),
                subTitle: __('Your phone number is unconfirmed. We send you SMS with passwod. Check your phone and enter password below.'),
                template: '<input type="number" placeholder="' + __('Code') + '" ng-model="confirmPhonePrompt.code" required />',
                scope: $scope,
                buttons: [
                    { text: __('Cancel') },
                    {
                        text: '<b>' + __('Check code') + '</b>',
                        type: 'button-positive',
                        onTap: function(event) {
                            if (!$scope.confirmPhonePrompt.code) {
                                event.preventDefault();
                                return null;
                            }

                            return $scope.confirmPhonePrompt.code;
                        }
                    }
                ]
            }).then(function(code) {
                if (!code) {
                    return;
                }

                $ionicLoading.show({ template: __('Please wait') + '..' });

                $scope.currUser.$update({
                    profile: { isPhoneNumberConfirmed: true },
                    _params: { code: code }

                }).then(
                    function() {
                        $ionicLoading.show({
                            template: __('Your phone was confirmed'),
                            noBackdrop: true,
                            duration: 1000
                        });
                    },
                    function(error) {
                        $ionicLoading.hide();

                        var params = null;
                        if (error.data && error.data.code && error.data.code == ErrorCode.INVALID_INPUT) {
                            params = { message: __("Unable to confirm phone") }
                        }

                        $scope.onError(error, params);
                    }
                );
            });
        };

        $scope.resendPhoneConfirmationCode = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            var confirmation = new PendingConfirmation({ id: 'phoneNumber' });

            confirmation.$save().then(
                function() {
                    $ionicLoading.show({
                        template: __('Message sent'),
                        noBackdrop: true,
                        duration: 2000
                    });
                },
                $scope.onError
            );
        };

        $scope.resendConfirmationEmail = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            var confirmation = new PendingConfirmation({ id: 'email' });

            confirmation.$save().then(
                function() {
                    $ionicLoading.show({
                        template: __('Confirmation email was sent'),
                        noBackdrop: true,
                        duration: 3000
                    });
                },
                $scope.onError
            );
        };

        $scope.password = {};
        $scope.changePassword = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            $scope.currUser.$update({
                password: $scope.password.new,
                _params: { oldPassword: $scope.password.old }

            }).then(
                function() {
                    $ionicLoading.show({
                        template: __('Password has been successfully changed'),
                        noBackdrop: true,
                        duration: 1000
                    });

                    $scope.logout();
                },
                function(error) {
                    $ionicLoading.hide();

                    var params = null;
                    if (error.data && error.data.code && error.data.code == ErrorCode.INVALID_INPUT) {
                        params = { message: __("Invalid password") }
                    }

                    $scope.onError(error, params);
                }
            );
        };
    });