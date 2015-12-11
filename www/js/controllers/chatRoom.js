angular.module('hotvibes.controllers')

    .controller('ChatRoomCtrl', function(
        $scope, $stateParams, $ionicModal, $ionicLoading, $ionicPopup,
        __, Api, ChatRoomPost
    ) {
        var loadPosts = function() {
            return ChatRoomPost.query({
                roomId: $stateParams.id,
                include: 'author.profilePhoto.url(size=w80h80)'
            });
        };

        $scope.posts = loadPosts();
        $scope.doRefresh = function() {
            loadPosts().$promise.then(function(result) {
                $scope.posts = result.resource;
                $scope.$broadcast('scroll.refreshComplete');
            });
        };

        $ionicModal
            .fromTemplateUrl('templates/chat_room_post_new.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function(modal) {
                $scope.modal = modal;
                $scope.modal.newPost = {};
            });

        $scope.openPostComposer = function() {
            $scope.modal.show();
        };

        $scope.closePostComposer = function() {
            $scope.modal.hide();
        };

        $scope.submitPost = function() {
            // Reset errors
            $scope.errors = {};

            var post = new ChatRoomPost();
            post.body = $scope.modal.newPost.text;

            $ionicLoading.show();
            post.$save({
                    roomId: $stateParams.id
                },
                function() {
                    // Success
                    $ionicLoading.hide();

                    post.created = Math.round(Date.now() / 1000);
                    post.author = $scope.currUser;
                    post.cntComments = 0;

                    $scope.posts.unshift(post);

                    $scope.modal.newPost = {};
                    $scope.closePostComposer();

                },
                function(response) {
                    // Error
                    $ionicLoading.hide();

                    if (
                        response.status == 400 /* Bad Request*/
                        && response.data.field
                    ) {
                        $scope.errors[response.data.field] = response.data.message;

                    } else {
                        $ionicPopup.alert({
                            title: __("Something's wrong"),
                            template: response.data
                                ? Api.translateErrorCode(response.data.code)
                                : __("We're sorry, but something went wrong. Please try again later.")
                        });
                    }
                }
            );
        };
    });