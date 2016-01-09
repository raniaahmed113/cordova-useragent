angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function(
        $rootScope, $scope, $state, $ionicUser, $ionicPush, $ionicPlatform, $ionicHistory, $ionicPopup, $ionicLoading,
        __, AuthService, Config, PushNotificationHandler, Api
    ) {
        $scope.logout = function() {
            AuthService.setCurrentUser(null);
            $state.go('login');
            $ionicHistory.clearCache();
        };

        $scope.$on('authTokenExpired', function() {
            $ionicLoading.show({
                template: __('You have been logged-out. Please log-in again.'),
                noBackdrop: true,
                duration: 3000
            });

            $scope.logout();
        });

        $scope.rightMenuEnabled = $state.current.views.rightMenu ? true : false;
        $scope.$on('$stateChangeStart', function(event, state) {
            $scope.rightMenuEnabled = state.views && state.views.rightMenu ? true : false;
        });

        // Load the currently-logged-in user instance from the localStorage
        $scope.currUser = AuthService.getCurrentUser();

        // Start listening for changes to currUser instance: update localStorage on every change
        $scope.$watch('currUser', function(newUser, oldUser) {
            if (newUser === oldUser) {
                return;
            }

            console.log('currUser has changed');
            AuthService.setCurrentUser(newUser);

        }, true);

        // Start listening for push notifications
        $ionicPlatform.ready(function() {
            if (!window.cordova) {
                return;
            }

            var user = $ionicUser.current();
            var userId = (Config.IS_LIVE_DB ? "" : "dev-") + $scope.currUser.id;

            if (user.id != userId) {
                if (!user.isFresh()) {
                    user = new $ionicUser();
                }

                user.id = userId;
            }

            $ionicPush.init({
                debug: false,
                onNotification: function(notification) {
                    PushNotificationHandler.handle(notification);
                },
                onRegister: function(data) {
                    user.addPushToken(data.token);
                    user.save();
                }
            });

            $ionicPush.register();
        });

        $scope.onError = function(response, params) {
            var errMessage;
            if (params && params.message) {
                errMessage = params.message;

            } else if (response && response.data) {
                errMessage = Api.translateErrorCode(response.data.code);

            } else {
                errMessage = __("We're sorry, but something went wrong. Please try again later.");
            }

            $ionicLoading.hide();
            $ionicPopup.alert({
                title: params && params.title || __("Something's wrong"),
                template: errMessage
            });
        };
    });