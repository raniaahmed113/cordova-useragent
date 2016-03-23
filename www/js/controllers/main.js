angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function(
        $rootScope, $scope, $state, $ionicPlatform, $ionicHistory, $ionicPopup, $ionicLoading,
        __, AuthService, Config, Api, PushNotificationHandler
    ) {
        $scope.logout = function() {
            PushNotificationHandler.unregister();
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

        function checkShouldRightMenuBeEnabled(state) {
            $scope.rightMenuEnabled = state.views && state.views.rightMenu ? true : false;
        }

        checkShouldRightMenuBeEnabled($state.current);

        // Some views make use of the right menu (eg. users list, right menu used for filtering the list)
        // So.. let's check, after each state change, whether this state has some content in the rightMenu
        $scope.$on('$stateChangeStart', function(event, state) {
            checkShouldRightMenuBeEnabled(state);
        });

        // Load the currently-logged-in user instance from the localStorage
        $scope.currUser = AuthService.getCurrentUser();

        // Start listening for changes to currUser instance: update localStorage on every change
        $scope.$watch('currUser', function(newUser, oldUser) {
            if (newUser === oldUser) {
                return;
            }

            AuthService.setCurrentUser(newUser);

        }, true);

        // Watch for changes to cacheCounts and update the counter of the side-menu badge
        $scope.$watchGroup([ 'currUser.cacheCounts.cntUnreadMessages', 'currUser.cacheCounts.cntNewGuests' ], function() {
            $scope.cntUnseenEvents = Math.max(0, $scope.currUser.cacheCounts.cntUnreadMessages)
                + Math.max(0, $scope.currUser.cacheCounts.cntNewGuests);
        });

        var subId = PushNotificationHandler.subscribe('newMessage.received', function() {
            $scope.currUser.cacheCounts.cntUnreadMessages += 1;
        });

        $scope.$on('$destroy', function() {
            PushNotificationHandler.unsubscribe(subId);
        });

        /*$scope.$on('newGuest', function(event, guest) {
            console.log(guest);
        });*/

        // Start listening for push notifications
        $ionicPlatform.ready(function() {
            if (!window.cordova) {
                // Do nothing if app is running in a browser rather than as an app on an actual device
                return;
            }

            PushNotificationHandler.init();
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