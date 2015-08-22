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

    .controller('UsersCtrl', function($scope, $rootScope, $ionicSideMenuDelegate, $ionicScrollDelegate, Api, User, AuthService) {
        $scope.currPage = 0;
        $scope.users = [];
        $scope.users.moreAvailable = true;
        $scope.filter = AuthService.getCurrentUser().filter;

        var loadUsers = function() {
            User.query(angular.extend({ page: $scope.currPage }, Api.formatFilter($scope.filter)), function(response) {
                $scope.users = $scope.currPage == 1 ? response.resource : $scope.users.concat(response.resource);
                $scope.users.moreAvailable = response.resource.moreAvailable;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        };

        $rootScope.$on('users.filterChanged', function(event, filter) {
            $ionicScrollDelegate.scrollTop(true);
            $scope.filter = filter;
            $scope.currPage = 1;
            loadUsers();
        });

        $scope.loadMore = function() {
            $scope.currPage += 1;
            loadUsers();
        };

        $scope.showFilter = function() {
            $ionicSideMenuDelegate.toggleRight();
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

    .controller('UserCtrl', function($scope, $stateParams, User) {
        $scope.user = User.get({ id: $stateParams.userId });
    })

    .controller('ConversationsCtrl', function($scope, $ionicActionSheet, Conversation, AuthService) {
        $scope.conversations = Conversation.query({
            ownerId: AuthService.getCurrentUserId()
        });
        $scope.deleteItem = function(index) {
            $scope.conversations[index].$delete();
            $scope.conversations.splice(index, 1);
        };
    })

    .controller('ConversationCtrl', function($scope, $stateParams, Conversation, Message, AuthService) {
        var params = {
            ownerId: AuthService.getCurrentUserId(),
            withUserId: $stateParams.id
        };

        $scope.conversation = Conversation.get(params); // FIXME: get from cache
        $scope.messages = Message.query(params);
    })

    .controller('GuestsCtrl', function($scope, Guest, AuthService) {
        var currPage = 0;
        $scope.users = [];
        $scope.users.moreAvailable = true;
        $scope.title = 'Guests';

        $scope.loadMore = function() {
            Guest.query({ userId: AuthService.getCurrentUserId(), page: ++currPage}, function(response) {
                $scope.users = $scope.users.concat(response.resource.map(function(data) {
                    return data.guest;
                }));
                $scope.users.moreAvailable = response.resource.moreAvailable;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        };
    });