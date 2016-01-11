angular.module('hotvibes.controllers')

    .controller('ChatRoomCtrl', function(
        $scope, $stateParams, $ionicModal, $ionicLoading, $ionicPopup,
        __, Api, ChatRoomPost
    ) {
        $scope.chatRoom = {
            id: $stateParams.id
        };

        function loadPosts() {
            return ChatRoomPost.query({
                roomId: $scope.chatRoom.id,
                include: 'author.profilePhoto.url(size=w80h80)'
            });
        }

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
                    roomId: $scope.chatRoom.id
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
    })

    .controller('ChatRoomPostCtrl', function($scope, $stateParams, $ionicScrollDelegate, ChatRoomPost, ChatRoomPostComment) {
        $scope.post = ChatRoomPost.get({
            roomId: $stateParams.roomId,
            id: $stateParams.id,
            include: [
                'author.profilePhoto.url(size=w50h50)',
                'comments.author.profilePhoto.url(size=w50h50)'

            ].join(',')
        });

        $scope.newComment = {};
        $scope.sendComment = function() {
            if (!$scope.newComment.text) {
                return;
            }

            var comment = new ChatRoomPostComment({
                roomId: $stateParams.roomId,
                postId: $scope.post.id,
                author: $scope.currUser,
                text: $scope.newComment.text,
                datePosted: null
            });

            var index = $scope.post.comments.push(comment);

            // Clear input after sending
            $scope.newComment.text = '';

            $ionicScrollDelegate.scrollBottom(true);

            comment.$save().then(
                function() {
                    comment.datePosted = (new Date().getTime() / 1000);
                },
                function() {
                    $scope.post.comments.splice(index, 1);
                }
            );
        };
    });