function enableUserDeletion($scope) {
    $scope.users.$promise.then(function() {
        if ($scope.users.length < 1) {
            return;
        }

        // User list has loaded
        $scope.deleteMode = false;
        $scope.toggleDeleteMode = function() {
            $scope.deleteMode = !$scope.deleteMode;
        };
        $scope.delete = function($event, $index) {
            $event.preventDefault();

            var userToDelete = $scope.users.splice($index, 1)[0];
            userToDelete.$delete();
        }
    });
}

angular.module('hotvibes.controllers')

    .controller('UsersCtrl', function($scope, $ionicSideMenuDelegate, $ionicScrollDelegate, Api, User) {
        $scope.showFilter = function() {
            $ionicSideMenuDelegate.toggleRight();
        };

        $scope.$watch('currUser.filter', function(newFilter, oldFilter) {
            if (newFilter === oldFilter) {
                // Called due to initialization - ignore
                return;
            }

            if (newFilter.cityId && newFilter.country != oldFilter.country) {
                // Country has changed - let's reset the chosen city too
                newFilter.cityId = newFilter.city = null;
                return;
            }

            // Search results filter has changed - re-fetch newly filtered results
            $ionicScrollDelegate.scrollTop(true);
            loadUsers();

            // Save the filter to the back-end
            newFilter.$update();

        }, true);

        var loadUsers = function() {
            var params = {
                photoSize: 'w80h80' /* include: 'profilePhoto.url(size=w80h80)' */
            };

            if ($scope.currUser.filter) {
                params = angular.extend(params, Api.formatFilter($scope.currUser.filter));
            }

            $scope.users = User.query(params);
        };

        loadUsers();
    })

    .controller('GuestsCtrl', function($scope, __, Guest) {
        $scope.title = __('Guests');
        $scope.subProperty = 'guest';
        $scope.users = Guest.query({ include: 'guest.profilePhoto.url(size=w80h80)' });
    })

    .controller('FriendsCtrl', function($scope, __, Friend) {
        $scope.title = __('Friends');
        $scope.subProperty = 'friend';
        $scope.users = Friend.query({ include: 'friend.profilePhoto.url(size=w80h80)' });

        enableUserDeletion($scope);
    })

    .controller('BlockedUsersCtrl', function($scope, __, BlockedUser) {
        $scope.title = __('My BlackList');
        $scope.subProperty = 'blockedUser';
        $scope.users = BlockedUser.query({ include: 'blockedUser.profilePhoto.url(size=w80h80)' });

        enableUserDeletion($scope);
    });