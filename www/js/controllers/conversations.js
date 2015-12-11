angular.module('hotvibes.controllers')

    .controller('ConversationsCtrl', function($scope, $rootScope, $ionicActionSheet, Conversation) {
        $scope.conversations = Conversation.query();

        $scope.deleteItem = function(item) {
            var index = $scope.conversations.indexOf(item);
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
                    break;
                }
            });
        });
    })

    .controller('ConversationCtrl', function(
        $scope, $rootScope, $stateParams, $ionicScrollDelegate, $ionicPopup,
        __, Conversation, Message, User, Api
    ) {
        var params = {
            withUserId: $stateParams.userId || $stateParams.id
        };

        $scope.msgText = '';
        $scope.conversation = Conversation.get(params, null, null, function(err) { // FIXME: get from cache
            if (err.status == 404 /* Not Found */) {
                // There is no conversation created yet
                $scope.conversation.withUser = User.get({ id: params.withUserId }); // FIXME: get from cache
            }
        });

        $scope.messages = Message.query(params, function(response) {
            $ionicScrollDelegate.scrollBottom(true);

            // TODO: load more
            // TODO: support for attachments
        });

        $scope.$on('newMessage', function(event, msg) {
            $scope.messages.push(msg);
            $ionicScrollDelegate.scrollBottom(true);
        });

        $scope.sendMessage = function(msg) {
            if (!msg) {
                msg = new Message({
                    id: $scope.currUser.id,
                    text: $scope.msgText,
                    dateSent: null,
                    conversationId: $scope.conversation.id
                });

                $rootScope.$broadcast('newMessage', msg);

                // Clear message input after sending
                $scope.msgText = '';
            }

            msg.$save(params, function() {
                msg.dateSent = Math.round(Date.now() / 1000);

            }, function(error) {
                var allowTryAgain = error.status == 0 || error.status == 500;

                if (allowTryAgain) {
                    msg.error = Api.translateErrorCode(error.data ? error.data.code : null);

                } else {
                    $ionicPopup.alert({
                        title: __("Something's wrong"),
                        template: error.data
                            ? Api.translateErrorCode(error.data.code)
                            : __("We're sorry, but something went wrong. Please try again later.")
                    });
                }
            });
        };

        $scope.resend = function(messageIndex) {
            if (!$scope.messages[messageIndex].error) {
                return;
            }

            // Clear the error flag
            delete $scope.messages[messageIndex].error;

            // Send again
            $scope.sendMessage($scope.messages[messageIndex]);
        }
    });