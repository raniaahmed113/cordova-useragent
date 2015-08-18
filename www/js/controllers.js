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

    .controller('UsersCtrl', function($scope, User) {
        var currPage = 0;
        $scope.users = [];
        $scope.users.moreAvailable = true;

        $scope.loadMore = function() {
            User.query({ page: ++currPage}, function(response) {
                $scope.users = $scope.users.concat(response.resource);
                $scope.users.moreAvailable = response.resource.moreAvailable;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        };
    })

    .controller('UserCtrl', function($scope, $stateParams, User) {
        $scope.user = User.get({
            id: $stateParams.userId
        });

        /*$scope.newPerson = new Person({
            "name": "Mick Johnson",
            "email": "mick@example.com"
         });
         $scope.newPerson.$save();*/
    })

    .controller('ConversationsCtrl', function($scope, $ionicActionSheet, Conversation, AuthService) {
        $scope.conversations = Conversation.query({
            ownerId: AuthService.getCurrentUserId()
        });
        $scope.showDetails = function(conversationIndex) {
            $ionicActionSheet.show({
                destructiveText: 'Delete',
                cancelText: 'Cancel',
                destructiveButtonClicked: function() {
                    var conversation = $scope.conversations[conversationIndex];
                    conversation.$delete({ ownerId: AuthService.getCurrentUserId(), withUserId: conversation.id});
                    $scope.conversations.splice(conversationIndex, 1);
                    return true;
                }
            });
        };
    })

    .controller('ConversationCtrl', function($scope, $stateParams, Conversation, Message, AuthService) {
        var params = {
            ownerId: AuthService.getCurrentUserId(),
            withUserId: $stateParams.id
        };

        $scope.conversation = Conversation.get(params); // FIXME: get from cache
        $scope.messages = Message.query(params);
    });