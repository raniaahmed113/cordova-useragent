angular.module('hotvibes.models', ['ngResource', 'hotvibes.config'])

    .factory('ApiResource', function($q, $resource, $http, Config) {
        return function(url, urlParamMapping, options) {
            url = Config.API_URL_BASE + url;

            var ApiResource = $resource(url, urlParamMapping, options);

            /**
             * Performs a partial update of the resource using the PATCH HTTP method.
             *
             * @param {object} params entity body of the HTTP request
             * @returns {Promise}
             */
            ApiResource.prototype.$update = function(params) {
                function getCompleteUrl(resource) {
                    var completeUrl = angular.copy(url);

                    Object.keys(urlParamMapping).forEach(function(key) {
                        var value = urlParamMapping[key];
                        if (value[0] == '@') {
                            value = resource[value.substr(1)];
                        }

                        completeUrl = completeUrl.replace(new RegExp(":" + key), value);
                    });

                    return completeUrl;
                }

                var deferred = $q.defer(),
                    modelInstance = this;

                $http.patch(getCompleteUrl(this), params).then(
                    function(response) {
                        angular.merge(modelInstance, params);
                        deferred.resolve(response);
                    },
                    deferred.reject
                );

                return deferred.promise;
            };

            function processQueryParams(params) {
                if (params.include && angular.isArray(params.include)) {
                    params.include = params.include.join(',');
                }

                if (params.require && angular.isArray(params.require)) {
                    params.require = params.require.join(',');
                }

                return params;
            }

            var originalGetFunc = ApiResource.get;
            ApiResource.get = function(params) {
                return originalGetFunc(processQueryParams(params));
            };

            var originalQueryFunc = ApiResource.query;
            ApiResource.query = function(params) {
                return originalQueryFunc(processQueryParams(params));
            };

            return ApiResource;
        };
    })

    .factory('User', function($q, $window, ApiResource, Filter, Device) {
        var User = ApiResource('users/:id', { id: '@id' });

        User.valueOf = function(object) {
            if (!object || !object.id) {
                throw {
                    message: "Can't parse object into User instance: property 'id' is missing",
                    data: object
                };
            }

            if (!(object instanceof User)) {
                object = new User(object);
            }

            if (!object.filter || !(object.filter instanceof Filter)) {
                object.filter = new Filter(object.filter);
                object.filter.type = Filter.TYPE_MAIN;
            }

            if (object.cacheCounts) {
                if (object.cacheCounts.cntNewMessages < 0) {
                    object.cacheCounts.cntNewMessages = 0;
                }

                if (object.cacheCounts.cntNewGuests < 0) {
                    object.cacheCounts.cntNewGuests = 0;
                }
            }

            return object;
        };

        /**
         * @param {int|string} userId
         *
         * @returns {Promise}
         */
        User.getInstanceForStorage = function(userId) {
            var deferred = $q.defer();

            User.get({
                id: userId,
                require: [
                    'cacheCounts',
                    'profile'
                ],
                include: [
                    'filter',
                    'isVip',
                    'profilePhoto.url(size=w50h50)',
                    'cacheCounts.cntUnreadMessages'
                ]

            }).$promise.then(
                function(userData) {
                    try {
                        var user = User.valueOf(userData);

                    } catch (e) {
                        deferred.reject(e);
                        return;
                    }

                    deferred.resolve(user);
                },
                deferred.reject
            );

            return deferred.promise;
        };

        /**
         * @param {string} token
         *
         * @returns {Promise}
         */
        User.prototype.registerDevice = function(token) {
            return new Device({
                token: token,
                type: $window.cordova.platformId
            }).$save();
        };

        /**
         * @param {int} id
         *
         * @returns {Promise}
         */
        User.prototype.unregisterDevice = function(id) {
            return Device.delete({ id: id });
        };

        User.prototype.refresh = function() {
            var userInstance = this;

            User.getInstanceForStorage(this.id).then(function(freshUserData) {
                userInstance = angular.extend(userInstance, freshUserData);
            });
        };

        return User;
    })

    .factory('Device', function(ApiResource) {
        return ApiResource('me/devices/:id', { id: '@id' });
    })

    .factory('QuickieVote', function(ApiResource) {
        var QuickieVote = new ApiResource('me/quickieVotes');

        QuickieVote.YES = 'yes';
        QuickieVote.NO = 'no';

        return QuickieVote;
    })

    .factory('Filter', function(ApiResource) {
        var Filter = ApiResource('me/filters/:type', { type: '@type' }, {
            save: {
                method: 'PUT'
            }
        });

        Filter.TYPE_MAIN = 'main';

        return Filter;
    })

    .factory('Guest', function(ApiResource) {
        return ApiResource('me/guests');
    })

    .factory('Friend', function(ApiResource) {
        return ApiResource('me/friends/:userId');
    })

    .factory('SupportRequest', function(ApiResource) {
        return ApiResource('supportRequests/:id');
    })

    .factory('Album', function($q, __, ApiResource, MediaFile) {
        var Album = ApiResource('me/albums/:id', { id : '@id' }),
            parentGet = Album.get;

        Album.get = function(params) {
            if (params.id == 0) {
                var deferred = $q.defer();

                var fileQueryParams = {
                    albumId: params.id
                };

                if (params.include) {
                    fileQueryParams.include = params.include.replace(/photos\./g, '');
                }

                MediaFile.query(fileQueryParams).$promise.then(
                    function(result) {
                        var album = new Album();
                        album.id = params.id;
                        album.name = __("MainPictures");
                        album.photos = result.resource;

                        deferred.resolve(album);
                    },
                    deferred.reject
                );

                return { $promise: deferred.promise };
            }

            return parentGet(params);
        };

        return Album;
    })

    .factory('MediaFile', function(ApiResource) {
        return ApiResource('me/albums/:albumId/files/:id', { albumId: '@albumId', id: '@id' }, {
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

    .factory('Favorite', function(ApiResource) {
        return ApiResource('me/favorites/:userId');
    })

    .factory('BlockedUser', function(ApiResource) {
        return ApiResource('me/blocks/:userId');
    })

    .factory('ChatRoom', function(ApiResource) {
        return ApiResource('chatRooms/:id', { id: '@id' });
    })

    .factory('ChatRoomPost', function(ApiResource) {
        return ApiResource('chatRooms/:roomId/posts/:id', { id: '@id' });
    })

    .factory('ChatRoomPostComment', function(ApiResource) {
        return ApiResource('chatRooms/:roomId/posts/:postId/comments', { roomId: '@roomId', postId: '@postId' });
    })

    .factory('Conversation', function(ApiResource) {
        return ApiResource('me/conversations/:withUserId', { withUserId: '@id' });
    })

    .factory('Report', function(ApiResource) {
        return ApiResource('reports/:id', { id: '@id' });
    })

    .factory('Message', function(ApiResource) {
        return ApiResource('me/conversations/:withUserId/messages');
    })

    .factory('Request', function(ApiResource) {
        return ApiResource('me/requests');
    })

    .factory('PendingConfirmation', function(ApiResource) {
        return ApiResource('me/pendingConfirmations/:id', { id: '@id' }, {
            save: {
                method: 'PUT'
            }
        });
    })

    .factory('Gift', function(ApiResource) {
        return ApiResource('dataSets/gifts');
    })

    .factory('City', function(ApiResource) {
        return ApiResource('dataSets/cities');
    })

    .factory('UserGift', function(ApiResource) {
        return ApiResource('users/:userId/gifts', { userId: '@userId' });
    })

    .factory('DuelInvite', function(ApiResource) {
        return ApiResource('users/:userId/duelInvites', { userId: '@userId' });
    })

    .factory('Payment', function(ApiResource) {
        return ApiResource('paymentGateways/:gateway/payments', { gateway: '@gateway' });
    })

    .factory('__', function($translate) {
        return $translate.instant;
    })

    .factory('gettextCatalog', function() {
        return {

            /**
             * gettextCatalog.getPlural will be picked-up by the keyword extractor of angular-gettext (when using 'gulp translate-extract')
             * The actual translation will take place when the following HTML will be parsed
             * More info: https://angular-gettext.rocketeer.be/dev-guide/annotate-js/
             *
             * @param {int} num
             * @param {string} keySingular
             * @param {string} keyPlural
             *
             * @returns {string}
             */
            getPlural: function(num, keySingular, keyPlural) {
                return '<span translate="' + keySingular + '" translate-plural="' + keyPlural + '" translate-n="' + num + '"></span>';
            }
        }
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

            if (params.currentSelection) {
                $scope.currentSelection = params.currentSelection;
            }

            function onItemSelected(item) {
                params.onCitySelected(item);
                modalWindow.hide();
                $scope.input.searchQuery = '';
                $scope.rows = [];
                $scope.currentSelection = item;
            }

            $scope.clearCurrent = function() {
                onItemSelected(null);
            };

            $scope.onItemSelected = function(rowIndex) {
                onItemSelected($scope.rows[rowIndex]);
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
            country: {
                LT: __('Lithuania'),
                LV: __('Latvia'),
                PL: __('Poland'),
                HR: __('Croatia/Hrvatska'),
                GB: __('United Kingdom')
            },

            gender: {
                male: __('Man'),
                female: __('Female')
            },

            lookingFor: {
                male: __('Looking for male'),
                female: __('Looking for female'),
                anything: __('Looking for both')
            },

            maritalStatus: {
                single: __('Single'),
                taken: __('I have somone'),
                undecided: __('Secrete')
            },

            purpose: {
                dating: __('Real dates'),
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
                frequently: __('ED'),
                likeChimney: __('LC')
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