angular.module('hotvibes.models', ['ngResource', 'hotvibes.config'])

    .factory('User', function($resource, Config, Filter) {
        var User = $resource(Config.API_URL_BASE + 'users/:id', { id: '@id' });

        User.valueOf = function(data) {
            if (!data.id) {
                throw "Invalid data provided";
            }

            var output = new User(data);

            if (output.filter) {
                output.filter = new Filter(output.filter);
            }

            return output;
        };

        return User;
    })

    .factory('QuickieVote', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/quickieVotes');
    })

    .factory('Filter', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/filters/:type', { type: '@type' });
    })

    .factory('Guest', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/guests');
    })

    .factory('Friend', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/friends');
    })

    .factory('BlockedUser', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/blocks');
    })

    .factory('ChatRoom', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'chatRooms/:id', { id: '@id' });
    })

    .factory('ChatRoomPost', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'chatRooms/:roomId/posts/:id', { id: '@id' });
    })

    .factory('Conversation', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/conversations/:withUserId', { withUserId: '@id' });
    })

    .factory('Message', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/conversations/:withUserId/messages');
    })

    .factory('Request', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/requests');
    })

    .factory('Notification', function($resource, Config) {
        var model = $resource(Config.API_URL_BASE + 'me/notifications');

        model.prototype.getBody = function() {
            switch (this.type) {
                case 'commentWallPost':
                    return this.sender.login + ' has commented on your wall post.';

                case 'addGift':
                    return 'You have received a gift from ' + this.sender.login;

                case 'friendAccept':
                    return '<a href="#/users/' + this.sender.id + '">' + this.sender.login + '</a>' +
                        ' has accepted your friendship request.';

                default:
                    return '...';
            }
        };

        return model;
    });
