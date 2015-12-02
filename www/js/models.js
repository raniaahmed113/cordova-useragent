angular.module('hotvibes.models', ['ngResource', 'hotvibes.config'])

    .factory('User', function($resource, Config, Filter) {
        var User = $resource(
            Config.API_URL_BASE + 'users/:id',
            { id: '@id' },
            { update: { method: 'PATCH' }}
        );

        User.valueOf = function(data) {
            if (!data || !data.id) {
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
        return $resource(Config.API_URL_BASE + 'me/friends/:userId');
    })

    .factory('Album', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/albums/:id', { id : '@id' });
    })

    .factory('MediaFile', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/albums/:albumId/files/:id', { albumId: '@albumId', id: '@id' }, {
                save: {
                    method: 'POST',

                    // This will force the client to insert a proper Content-Type
                    // Something like this: multipart/form-data; boundary=----WebKitFormBoundarycNG3Zs8MLDFUcqF0
                    headers: { 'Content-Type': undefined },

                    transformRequest: function(resource) {
                        if (resource) {
                            var data = new FormData();

                            angular.forEach(resource, function(value, key) {
                                data.append(key, value);
                            });

                            return data;
                        }

                        return resource;
                    }
                }
            }
        );
    })

    .factory('Favorite', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/favorites/:userId');
    })

    .factory('BlockedUser', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'me/blocks/:userId');
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

    .factory('Gift', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'dataSets/gifts');
    })

    .factory('Country', function(__) {
        return {
            query: function() {
                return [
                    {id: 'LT', label: __('Lithuania')},
                    {id: 'LV', label: __('Latvia')},
                    {id: 'PL', label: __('Poland')},
                    {id: 'HR', label: __('Croatia/Hrvatska')},
                    {id: 'UK', label: __('United Kingdom')}
                ];
            }
        };
    })

    .factory('City', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'dataSets/cities');
    })

    .factory('UserGift', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'users/:userId/gifts', { userId: '@userId' });
    })

    .factory('DuelInvite', function($resource, Config) {
        return $resource(Config.API_URL_BASE + 'users/:userId/duelInvites', { userId: '@userId' });
    })

    .factory('Notification', function($resource, Config) {
        var model = $resource(Config.API_URL_BASE + 'me/notifications');

        model.prototype.getBody = function() {
            switch (this.type) {
                case 'commentWallPost':
                    return this.sender.nickName + ' has commented on your wall post.';

                case 'addGift':
                    return 'You have received a gift from ' + this.sender.nickName;

                case 'friendAccept':
                    return '<a href="#/users/' + this.sender.id + '">' + this.sender.nickName + '</a>' +
                        ' has accepted your friendship request.';

                default:
                    return '...';
            }
        };

        return model;
    })

    .factory('__', function($translate) {
        return $translate.instant;
    })

    .factory('CityPicker', function($q, $ionicModal, $rootScope, City) {
        return function(params) {
            var deferred = $q.defer(),
                $scope = $rootScope.$new(true),
                modalWindow;

            $scope.input = {};
            $scope.closeModal = function() {
                modalWindow.hide();
            };
            $scope.search = function() {
                if (!$scope.input.searchQuery) {
                    return;
                }

                $scope.searching = true;

                City.query({
                    country: params.getCountry(),
                    name: $scope.input.searchQuery

                }).$promise.then(
                    function(response) {
                        $scope.rows = response.resource.map(function(city) {
                            return {
                                id: city.id,
                                label: city.name
                            }
                        });
                    },
                    function(error) {
                        // TODO
                    }

                ).finally(function() {
                    $scope.searching = false;
                });
            };

            $scope.onItemSelected = function($index) {
                params.onCitySelected($scope.rows[$index]);
                modalWindow.hide();
                $scope.input.searchQuery = '';
                $scope.rows = [];
            };

            $ionicModal
                .fromTemplateUrl('templates/modal_autocomplete.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                })
                .then(
                    function(modal) {
                        modalWindow = modal;
                        deferred.resolve(modal);
                    },
                    deferred.reject
                );

            return deferred.promise;
        };
    })

    .factory('DataMap', function(__) {
        return {
            gender: {
                male: __('Man'),
                female: __('Female')
            },

            lookingFor: {
                male: __('Looking for male'),
                female: __('Looking for female')
            },

            maritalStatus: {
                single: __('Single'),
                taken: __('I have somone'),
                undecided: __('Secrete')
            },

            purpose: {
                dating: __('Real dates'),
                sex: __('S&M'),
                onlineChat: __('Online chat'),
                relationship: __('Normal relationships'),
                marriage: __('Mariage'),
                friendship: __('Socializing'),
                any: __('Any Dating')
            },

            doesDrink: {
                no: __('DD'),
                occasionally: __('Ocasionly'),
                frequently: __('Often')
            },

            doesSmoke: {
                no: __('DS'),
                occasionally: __('Sometimes'),
                frequently: __('ED')
            },

            livesWith: {
                parents: __('With parents'),
                roommates: __('With roommates'),
                noone: __('Alone'),
                partner: __('With a partner')
            },

            education: {
                atSchool: __('Studying at school'),
                middleSchool: __('High school graduate'),
                studying: __('Studying at college/university'),
                higher: __('College graduate'),
                bachelorsDegree: __("Bachelor degree"),
                mastersDegree: __("Master of Arts degree"),
                doctorsDegree: __("Doctoral degree")
            },

            employment: {
                unemployed: __('Unemployed'),
                selfEmployed: __('Self employed'),
                employed: __('Hired worker')
            },

            language: {
                en: __('English'),
                lt: __('Lietuvių'),
                lv: __('Latviešu'),
                et: __('Eesti'),
                pl: __('Polski'),
                ru: __('Русский'),
                es: __('Español'),
                pt: __('Português'),
                fr: __('Français'),
                de: __('Deutsch'),
                it: __('Italiano'),
                nl: __('Nederlands'),
                no: __('Norsk'),
                cs: __('Česky'),
                da: __('Dansk'),
                hr: __('Hrvatski'),
                ku: __('Kurdî'),
                la: __('Latina'),
                ro: __('Română'),
                sl: __('Slovenčina'),
                sk: __('Slovak'),
                fi: __('Suomi'),
                sv: __('Svenska'),
                el: __('Türkçe'),
                be: __('Беларуская'),
                uk: __('Українська'),
                bg: __('Български'),
                mk: __('Македонски')
            }
        };
    });
