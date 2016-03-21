angular.module('hotvibes.controllers')

    .controller('ConversationsCtrl', function($scope, $state, $rootScope, $ionicActionSheet, User, Conversation) {
        var authorIncludes = 'profilePhoto.url(size=w80h80)';

        $scope.conversations = Conversation.query({
            include: [
                'lastMessage',
                'withUser.' + authorIncludes
            ].join(',')
        });

        $scope.openConversation = function(conversation) {
            if (conversation.cntUnreadMessages > 0) {
                conversation.cntUnreadMessages = 0;
            }

            $state.go('inside.conversations-single', { id: conversation.id });
        };

        $scope.deleteItem = function(item) {
            var index = $scope.conversations.indexOf(item);
            $scope.conversations[index].$delete();
            $scope.conversations.splice(index, 1);
        };

        $rootScope.$on('newMessage', function(event, message) {
            $scope.conversations.$promise.then(function() {
                var conversationId = message['conversationId'],
                    conversation = null;

                for (var i=0; i<$scope.conversations.length; i++) {
                    // Find the right conversation in the list
                    if ($scope.conversations[i].id == conversationId) {
                        conversation = $scope.conversations[i];
                        break;
                    }
                }

                if (conversation != null) {
                    // Such conversation already exists, update the list
                    conversation.lastMessage = message;
                    conversation.cntUnreadMessages += 1;

                } else {
                    // Get info about the author of the message
                    // Then.. create a new conversation in the list
                    User.get({
                        id: conversationId,
                        include: authorIncludes

                    }).$promise.then(function(messageAuthor) {
                        $scope.conversations.unshift(
                            new Conversation({
                                id: conversationId,
                                withUser: messageAuthor,
                                cntUnreadMessages: 1,
                                lastMessage: message
                            })
                        );
                    });
                }
            });
        });
    })

    .controller('ConversationCtrl', function(
        $scope, $rootScope, $stateParams, $ionicScrollDelegate, $ionicPopup,
        __, Conversation, Message, User, Api
    ) {
        var params = {
            withUserId: $stateParams.userId || $stateParams.id,
            include: [
                'withUser'
            ].join(',')
        };

        $scope.msgText = '';
        $scope.conversation = Conversation.get(params, null, null, function(err) { // FIXME: get from cache
            if (err.status == 404 /* Not Found */) {
                // There is no conversation created yet
                $scope.conversation.withUser = User.get({ id: params.withUserId }); // FIXME: get from cache
            }
        });

        // Mark unread messages as 'seen'
        $scope.conversation.$promise.then(function(conversation) {
            if (conversation.cntUnreadMessages > 0) {
                $scope.currUser.cacheCounts.cntUnreadMessages -= conversation.cntUnreadMessages;
            }
        });

        $scope.messages = Message.query(params, function(response) {
            $ionicScrollDelegate.scrollBottom(true);

            // TODO: load more
            // TODO: support for attachments
        });

        $rootScope.$on('newMessage', function(event, msg) {
            $scope.messages.push(msg);
            $ionicScrollDelegate.scrollBottom(true);
        });

        $scope.sendMessage = function(msg) {
            if (!msg) {
                msg = new Message({
                    id: $scope.currUser.id,
                    text: $scope.msgText,
                    dateSent: null,
                    conversationId: $scope.conversation.id,
                    sendTime: new Date().getTime()
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

                    // Find & remove the failed-to-send message
                    for (var i=$scope.messages.length-1; i >= 0; i--) {
                        if ($scope.messages[i].sendTime == msg.sendTime) {
                            $scope.messages.splice(i, 1);
                            break;
                        }
                    }
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