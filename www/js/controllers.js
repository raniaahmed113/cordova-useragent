angular.module('hotvibes.controllers', ['hotvibes.services', 'hotvibes.models'])

    .controller('AppCtrl', function($scope, $state, authService) {
        $scope.logout = function() {
            authService.doLogout();
            $state.go('login');
        };
    })

    .controller('LoginCtrl', function($scope, authService, $state, $ionicLoading) {
        $scope.loginData = {};
        $scope.login = function() {
            var loginArgs = $scope.loginData;

            loginArgs.onLoggedIn = function() {
                $ionicLoading.hide();
                $state.go('inside.users');
            };

            loginArgs.onError = function() {
                $ionicLoading.hide();
                alert('Fail!');
            };

            $ionicLoading.show({ template: 'Logging in..'});
            authService.doLogin(loginArgs);
        };
    })

    .controller('UsersCtrl', function($scope, User) {
        /*$scope.newPerson = new Person({
            "name": "Mick Johnson",
            "email": "mick@example.com"
        });
        $scope.newPerson.$save();*/

        $scope.users = User.query();
    })

    .controller('UserCtrl', function($scope, $stateParams, User) {
        $scope.user = User.get({
            id: $stateParams.userId
        });
    })

    .controller('ConversationsCtrl', function($scope, Conversation, authService) {
        $scope.conversations = Conversation.query({
            ownerId: authService.getCurrentUserId()
        });
    })

    .controller('ConversationCtrl', function($scope, $stateParams, Conversation, authService) {
        $scope.conversation = Conversation.get({
            ownerId: authService.getCurrentUserId(),
            withUserId: $stateParams.id
        });
    });