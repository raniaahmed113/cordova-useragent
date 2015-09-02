angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function($scope, $state, $ionicHistory, AuthService) {
        $scope.logout = function() {
            AuthService.doLogout();
        };

        $scope.$on('authTokenExpired', function() {
            AuthService.doLogout();
        });

        $scope.$on('loggedOut', function() {
            $state.go('login');
            $ionicHistory.clearCache();
        });

        $scope.rightMenuEnabled = $state.current.views.rightMenu;
        $scope.$on('$stateChangeStart', function(event, state) {
            $scope.rightMenuEnabled = state.views.rightMenu ? true : false;
        });

        $scope.currUser = AuthService.getCurrentUser();
    })

    .controller('LoginCtrl', function($scope, AuthService, $state, $ionicLoading, $ionicPopup) {
        $scope.loginData = {};
        $scope.login = function() {
            var loginArgs = $scope.loginData;

            loginArgs.onLoggedIn = function() {
                $ionicLoading.hide();
                $state.go('inside.users');
            };

            loginArgs.onError = function(response) {
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: 'Houston, we have problems',
                    template: response && response.message ? response.message : 'Something unexpected happened. Please try again.'
                });
            };

            $ionicLoading.show({ template: 'Logging in..'});
            AuthService.doLogin(loginArgs);
        };
    })

    .controller('UsersFilterCtrl', function($scope, $rootScope, AuthService) {
        $scope.filter = AuthService.getCurrentUser().filter;
        $scope.$watch('filter', function(filter, oldFilter) {
            if (filter === oldFilter) {
                // Called due to initialization - ignore
                return;
            }

            $rootScope.$broadcast('users.filterChanged', filter);
            //AuthService.getCurrentUser().saveFilter(filter); // TODO

        }, true);

        $scope.countries = [
            {
                id: 'LT',
                label: 'Lithuania'
            }
        ]; // FIXME: add full list of countries

        var range = function(min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) input.push(i);
            return input;
        };

        $scope.ages = range(18, 99);
        $scope.lookingFor = ['male', 'female'];
        $scope.toggleSelection = function toggleSelection(type) {
            var idx = $scope.filter.lookingFor.indexOf(type);

            if (idx > -1) {
                $scope.filter.lookingFor.splice(idx, 1);

            } else {
                $scope.filter.lookingFor.push(type);
            }
        };
    })

    .controller('UsersCtrl', function($scope, $ionicSideMenuDelegate, Api, UserList, User, AuthService) {
        $scope.filter = AuthService.getCurrentUser().filter;
        $scope.showFilter = function() {
            $ionicSideMenuDelegate.toggleRight();
        };

        UserList.load(User, $scope, { photoSize: 'w128h129' });
    })

    .controller('UserCtrl', function($scope, $stateParams, $ionicSlideBoxDelegate, $ionicPlatform, User) {
        $scope.user = User.get({
            id: $stateParams.userId,
            profile: true,
            photos: true,
            albums: true
        });

        $scope.user.$promise.then(function() {
            $ionicSlideBoxDelegate.update();
        });

        // FIXME
        $scope.currentlyActiveTab = -1;
        $ionicPlatform.registerBackButtonAction(function() {
            if ($scope.currentlyActiveTab >= 0) {
                $scope.currentlyActiveTab = -1;
                return true;
            }

            return false;
        }, 101, 'closeActiveTab');

        $scope.tabs = [
            { icon: 'images', title: 'Photos' },
            { icon: 'person', title: 'About' },
            { icon: 'heart', title: 'Actions' },
            { icon: 'chatbubbles', title: 'Chat' }
        ];
        $scope.toggleTab = function(tabIndex) {
            if ($scope.currentlyActiveTab >= 0) {
                $scope.tabs[$scope.currentlyActiveTab].isActive = false;
            }

            if (tabIndex != $scope.currentlyActiveTab) {
                $scope.tabs[tabIndex].isActive = true;
                $scope.currentlyActiveTab = tabIndex;

            } else {
                $scope.currentlyActiveTab = -1;
            }
        };

        $scope.showUi = true;
        $scope.toggleOverlays = function() {
            $scope.showUi = !$scope.showUi;
        }
    })

    .controller('ConversationsCtrl', function($scope, $rootScope, $ionicActionSheet, Conversation, AuthService) {
        $scope.conversations = Conversation.query();
        $scope.deleteItem = function(index) {
            $scope.conversations[index].$delete();
            $scope.conversations.splice(index, 1);
        };

        $rootScope.$on('newMessage', function(event, message) {
            $scope.conversations.$promise.then(function() {
                var conversationId = message['conversationId'];

                for (var i=0; i<$scope.conversations.length; i++) {
                    // Find the right conversation in the list
                    if ($scope.conversations[i].id != conversationId) {
                        continue;
                    }

                    // Update the lastMessage info
                    $scope.conversations[i].lastMessage = message;
                }
            });
        });
    })

    .controller('ConversationCtrl', function($scope, $rootScope, $stateParams, $ionicScrollDelegate, Conversation, Message, AuthService) {
        var params = {
            withUserId: $stateParams.id
        };

        $scope.msgText = '';
        $scope.currUserId = AuthService.getCurrentUserId();
        $scope.conversation = Conversation.get(params); // FIXME: get from cache
        $scope.messages = Message.query(params, function() {
            $ionicScrollDelegate.scrollBottom(true);
            // TODO: load more
            // TODO: support for attachments
        });

        $scope.sendMessage = function() {
            var i = $scope.messages.push({
                    id: $scope.currUserId,
                    text: $scope.msgText,
                    dateSent: null,
                    conversationId: $scope.conversation.id
                })-1;

            var msg = new Message();
            msg.id = $scope.currUserId;
            msg.text = $scope.msgText;
            msg.$save(params, function() {
                $scope.messages[i].dateSent = Math.round(Date.now() / 1000);
                $rootScope.$broadcast('newMessage', $scope.messages[i]);

                // TODO: update conversations last message cache

            }, function(error) {
                $scope.messages[i].error = error.data.message;
            });

            $scope.msgText = '';
            $ionicScrollDelegate.scrollBottom(true);
        };

        $scope.resend = function(messageIndex) {
            if (!$scope.messages[messageIndex].error) {
                return;
            }

            delete $scope.messages[messageIndex].error;

            // TODO: resend
        }
    })

    .controller('GuestsCtrl', function($scope, Guest, UserList) {
        $scope.title = 'Guests';

        UserList.load(Guest, $scope, {}, function(guests) {
            return guests.map(function(data) {
                return data['guest'];
            });
        });
    })

    .controller('SettingsCtrl', function($scope) {
        // TODO: implement
    });