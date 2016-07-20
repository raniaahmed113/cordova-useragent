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

    .controller('ChatRoomPostCtrl', function(
        $window, $scope, $stateParams, $ionicPopup, $ionicPosition, $ionicScrollDelegate,
        __, Api, ChatRoomPost, ChatRoomPostComment
    ) {
        $scope.post = ChatRoomPost.get({
            roomId: $stateParams.roomId,
            id: $stateParams.id,
            include: [
                'author.profilePhoto.url(size=w50h50)'

            ].join(',')
        });

        $scope.comments = ChatRoomPostComment.query({
            roomId: $stateParams.roomId,
            postId: $stateParams.id,
            include: [
                'author.profilePhoto.url(size=w50h50)'

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

            $scope.comments.unshift(comment);

            // Clear input after sending
            $scope.newComment.text = '';

            // TODO: broadcast an event, which would increment the comment count in the previous (master) post list view
            var newCommentPos = $ionicPosition.position(angular.element(
                document.getElementById('list-comments').firstElementChild.firstElementChild // first comment element
            ));

            $ionicScrollDelegate.scrollTo(newCommentPos.left, newCommentPos.top, true);

            comment.$save().then(
                function() {
                    // Success
                    comment.datePosted = (new Date().getTime() / 1000);
                },
                function(error) {
                    // Failed
                    var index = $scope.comments.indexOf(comment);
                    $scope.comments.splice(index, 1);

                    // TODO:
                    // if (error.data.code === ErrorCode.VIP_REQUIRED) ..
                    // then errorMessage = __("You must either become a VIP member, or a real member and confirm your email address")

                    $ionicPopup.alert({
                        title: __("Something's wrong"),
                        template: error.data
                            ? Api.translateErrorCode(error.data.code)
                            : __("We're sorry, but something went wrong. Please try again later.")
                    });
                }
            );
        };
    });