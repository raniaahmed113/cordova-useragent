angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function ($rootScope, $scope, $state, $ionicPlatform, $ionicHistory, $ionicPopup, $ionicLoading, $cordovaGoogleAnalytics,
                                     __, AuthService, Config, Api, PushNotificationHandler, $cordovaNetwork) {
        $scope.logout = function () {
            PushNotificationHandler.unregister();
            AuthService.setCurrentUser(null);

            if (window.AdMob) {
                AdMob.removeBanner();
            }

            $state.go('login').then(function() {
                $ionicHistory.clearCache();
            });
        };

        $scope.$on('authTokenExpired', function() {
            $ionicLoading.show({
                template: __('You have been logged-out. Please log-in again.'),
                noBackdrop: true,
                duration: 3000
            });

            $scope.logout();
        });

        function onStateChanged(state) {
            $scope.rightMenuEnabled = state.views && state.views.rightMenu ? true : false;

            if (window.cordova && $cordovaGoogleAnalytics) {
                $cordovaGoogleAnalytics.trackView(state.name);
            }
        }

        $ionicPlatform.ready(function() {
            onStateChanged($state.current);
        });

        // Some views make use of the right menu (eg. users list, right menu used for filtering the list)
        // So.. let's check, after each state change, whether this state has some content in the rightMenu
        $scope.$on('$stateChangeStart', function(event, state) {
            onStateChanged(state);
        });

        // Load the currently-logged-in user instance from the localStorage
        $scope.currUser = AuthService.getCurrentUser();

        // Enable GA UserID tracking
        if (window.cordova && $cordovaGoogleAnalytics) {
            // The following method accepts string as an argument, so let's cast our int value
            var userId = $scope.currUser.id + "";
            $cordovaGoogleAnalytics.setUserId(userId);
        }

        // Start listening for changes to currUser instance: update localStorage on every change
        $scope.$watch('currUser', function(newUser, oldUser) {
            if (newUser === oldUser) {
                return;
            }

            AuthService.setCurrentUser(newUser);

        }, true);

        // Initiate a data refresh from the server
        $scope.currUser.refresh();

        // Watch for changes to cacheCounts and update the counter of the side-menu badge
        $scope.$watchGroup([ 'currUser.cacheCounts.cntUnreadMessages', 'currUser.cacheCounts.cntNewGuests' ], function() {
            $scope.cntUnseenEvents = Math.max(0, $scope.currUser.cacheCounts.cntUnreadMessages)
                + Math.max(0, $scope.currUser.cacheCounts.cntNewGuests);
        });

        // TODO: move push notification handling/cacheCounts incrementation to a dedicated service?
        $scope.$on('newMessage.received', function(event, msg) {
            if (
                $state.$current.self.name == 'inside.conversations-single'
                && $state.$current.locals.globals.$stateParams.id == msg.id
            ) {
                // We shouldn't increment the 'unread messages' counter..
                // ..if, our current view is a conversation with the author of this message
                return;
            }

            $scope.currUser.cacheCounts.cntUnreadMessages += 1;
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

            if (window.AdMob && !$scope.currUser.isVip) {
                AdMob.createBanner({
                    adId: "ca-app-pub-0852903784956418/9265490294",
                    position: AdMob.AD_POSITION.BOTTOM_CENTER,
                    autoShow: true
                    // ,isTesting: true
                });

                $scope.$watch("currUser.isVip", function(newValue, oldValue) {
                    if (newValue === oldValue || newValue !== true) {
                        return;
                    }

                    AdMob.removeBanner();
                }, true);
            }
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

        $scope.internetConnected = true;

        document.addEventListener("deviceready", function () {
            $scope.internetConnected = !(navigator.connection.type == Connection.NONE);

            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function(){
                $scope.internetConnected = true;
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function(){
                $scope.internetConnected = false;
            })

        }, false);
    });