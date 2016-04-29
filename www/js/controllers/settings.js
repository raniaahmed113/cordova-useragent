angular.module('hotvibes.controllers')

    .controller('SettingsProfileCtrl', function(
        $scope, $ionicLoading, $ionicPopup, $q,
        __, PendingConfirmation, CityPicker, ErrorCode, DataMap
    ) {
        $scope.settings = angular.copy($scope.currUser);

        $scope.$watch('settings.country', function(newVal, oldVal) {
            if (newVal === oldVal) {
                return;
            }

            $scope.settings.city = '';
        });

        $scope.save = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            $scope.currUser.$update(
                FormUtils.getDirtyFields($scope.settings.form).settings

            ).then(
                function() {
                    if ($scope.settings.profile.phoneNumber != $scope.currUser.profile.phoneNumber) {
                        $scope.currUser.profile.isPhoneNumberConfirmed = false;
                    }

                    if ($scope.settings.email != $scope.currUser.email) {
                        $scope.currUser.profile.isEmailConfirmed = false;
                    }

                    $scope.settings.form.$setPristine();

                    $ionicLoading.show({
                        template: __('Saved'),
                        noBackdrop: true,
                        duration: 1000
                    });
                },
                $scope.onError

            ).finally(function() {
                $ionicLoading.hide();
            });
        };

        $scope.countries = DataMap.country;

        new CityPicker({
            getCountry: function() {
                return $scope.settings.country;
            },
            onCitySelected: function(city) {
                $scope.settings.city = city.label;
                $scope.settings.form['settings.city'].$setDirty();
            }
        }).then(function(modal) {
            $scope.modal = modal;
        });

        // FIXME: don't show 'unconfirmed' alert if field is empty or dirty
        $scope.confirmPhone = function() {
            $scope.confirmPhonePrompt = { code: null };

            $ionicPopup.prompt({
                title: __('Confirm your phone number'),
                subTitle: __('Your phone number is unconfirmed. We send you SMS with passwod. Check your phone and enter password below.'),
                template: '<input type="number" placeholder="' + __('Code') + '" ng-model="confirmPhonePrompt.code" required />',
                scope: $scope,
                buttons: [
                    { text: __('Cancel') },
                    {
                        text: '<b>' + __('Check code') + '</b>',
                        type: 'button-positive',
                        onTap: function(event) {
                            if (!$scope.confirmPhonePrompt.code) {
                                event.preventDefault();
                                return null;
                            }

                            return $scope.confirmPhonePrompt.code;
                        }
                    }
                ]
            }).then(function(code) {
                if (!code) {
                    return;
                }

                $ionicLoading.show({ template: __('Please wait') + '..' });

                $scope.currUser.$update({
                    profile: { isPhoneNumberConfirmed: true },
                    _params: { code: code }

                }).then(
                    function() {
                        $ionicLoading.show({
                            template: __('Your phone was confirmed'),
                            noBackdrop: true,
                            duration: 1000
                        });
                    },
                    function(error) {
                        $ionicLoading.hide();

                        var params = null;
                        if (error.data && error.data.code && error.data.code == ErrorCode.INVALID_INPUT) {
                            params = { message: __("Unable to confirm phone") }
                        }

                        $scope.onError(error, params);
                    }
                );
            });
        };

        $scope.resendPhoneConfirmationCode = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            var confirmation = new PendingConfirmation({ id: 'phoneNumber' });

            confirmation.$save().then(
                function() {
                    $ionicLoading.show({
                        template: __('Message sent'),
                        noBackdrop: true,
                        duration: 2000
                    });
                },
                $scope.onError
            );
        };

        $scope.resendConfirmationEmail = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            var confirmation = new PendingConfirmation({ id: 'email' });

            confirmation.$save().then(
                function() {
                    $ionicLoading.show({
                        template: __('Confirmation email was sent'),
                        noBackdrop: true,
                        duration: 3000
                    });
                },
                $scope.onError
            );
        };

        $scope.password = {};
        $scope.changePassword = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            $scope.currUser.$update({
                password: $scope.password.new,
                _params: { oldPassword: $scope.password.old }

            }).then(
                function() {
                    $ionicLoading.show({
                        template: __('Password has been successfully changed'),
                        noBackdrop: true,
                        duration: 1000
                    });

                    $scope.logout();
                },
                function(error) {
                    $ionicLoading.hide();

                    var params = null;
                    if (error.data && error.data.code && error.data.code == ErrorCode.INVALID_INPUT) {
                        params = { message: __("Invalid password") }
                    }

                    $scope.onError(error, params);
                }
            );
        };
    })

    .controller('SettingsAboutCtrl', function($scope, $ionicLoading, __, DataMap) {
        $scope.aboutMe = angular.copy($scope.currUser.profile);

        $scope.purposes = DataMap.purpose;
        $scope.selectables = [
            { id: 'maritalStatus', label: __('Status:'), options: DataMap.maritalStatus },
            { id: 'livesWith', label: __('Living'), options: DataMap.livesWith },
            { id: 'doesSmoke', label: __('Smoking'), options: DataMap.doesSmoke },
            { id: 'doesDrink', label: __('Drinking'), options: DataMap.doesDrink },
            { id: 'education', label: __('Education'), options: DataMap.education },
            { id: 'employment', label: __('Work'), options: DataMap.employment }
        ];

        $scope.save = function() {
            $ionicLoading.show({ template: __('Please wait') + '..' });

            var form = this.aboutMeForm,
                changes = { profile: FormUtils.getDirtyFields(form).aboutMe };

            $scope.currUser.$update(changes)
                .then(
                    function() {
                        $scope.currUser = angular.merge($scope.currUser, changes);
                        form.$setPristine();

                        $ionicLoading.show({
                            template: __('Saved'),
                            noBackdrop: true,
                            duration: 1000
                        });
                    },
                    $scope.onError

                ).finally(function() {
                    $ionicLoading.hide();
                });
        };
    })

    .controller('SettingsAlbumsCtrl', function($scope, $ionicPopover, $ionicPopup, $ionicLoading, __, Album) {
        $scope.albums = Album.query({ include: 'mainPhoto.url(size=w80h80)' });

        $scope.promptCreateAlbum = {
            albumName: null
        };

        $scope.$on('albumDeleted', function(albumId) {
            var $index = -1;

            for (var i=0; i<$scope.albums.length; i++) {
                if ($scope.albums[i].id == albumId) {
                    $index = index;
                    break;
                }
            }

            if ($index > -1) {
                $scope.albums.splice($index, 1);
            }
        });

        $scope.createAlbum = function() {
            $ionicPopup.prompt({
                title: __('Add New Album'),
                subTitle: __('Enter album name'),
                template: '<input type="text" ng-model="promptCreateAlbum.albumName" required />',
                scope: $scope,
                buttons: [
                    { text: __('Cancel') },
                    {
                        text: '<b>' + __('Create') + '</b>',
                        type: 'button-positive',
                        onTap: function(event) {
                            if (!$scope.promptCreateAlbum.albumName) {
                                event.preventDefault();
                                // TODO: show error
                                return null;
                            }

                            return $scope.promptCreateAlbum.albumName;
                        }
                    }
                ]

            }).then(function(name) {
                if (!name) {
                    return;
                }

                $ionicLoading.show({ template: __('Please wait') + '..' });

                var album = new Album({ name: name });
                album.$save().then(
                    function() {
                        $scope.albums.push(album);
                    },

                    $scope.onError

                ).finally(function() {
                    $ionicLoading.hide();
                });
            });
        };
    })

    .controller('SettingsCreditsCtrl', function($scope, $ionicLoading, __, gettextCatalog, Config) {
        if (window.store) {
            //store.verbosity = store.DEBUG;
            // FIXME: resolve gateway ID properly via device platform
            store.validator = Config.API_URL_BASE + "paymentGateways/google/payments?u=" + $scope.currUser.id;

            store.register({
                id: "lt.vertex.flirtas.purchase.credits200",
                alias: "200 credits",
                type: store.CONSUMABLE
            });

            store.register({
                id: "lt.vertex.flirtas.purchase.credits500",
                alias: "500 credits",
                type: store.CONSUMABLE
            });

            /*store.register({
                id: "lt.vertex.flirtas.purchase.vip",
                alias: "vip",
                type: store.PAID_SUBSCRIPTION
            });*/

            store.when("product").approved(function(product) {
                $ionicLoading.show({ template: __("Please wait") + '..'});
                product.verify();
            });

            store.when("product").verified(function(product) {
                var numCredits;

                switch (product.alias) {
                    case '200 credits':
                        numCredits = 200;
                        break;

                    case '500 credits':
                        numCredits = 500;
                        break;

                    default:
                        throw "Unknown product: " + product.alias;
                }

                $scope.currUser.credits += numCredits;
                $ionicLoading.hide();

                product.finish();

                $ionicPopup.alert({
                    title: __("Payment successful"),
                    template: gettextCatalog.getPlural(numCredits, "You have received %u credit", "You have received %u credits"),
                    buttons: [
                        { text: __("Cool, thanks!") }
                    ]
                });
            });

            $scope.billingSupported = true;

            store.ready(function() {
                $scope.creditOptions = [
                    { amount: 200, buy: function() { store.order("200 credits"); } },
                    { amount: 500, buy: function() { store.order("500 credits"); } }
                ];
            });

            store.refresh();
        }
    })

    .controller('SettingsVipCtrl', function($scope, $ionicLoading, $ionicPopup, Config) {
        if (window.store) {
            $scope.billingSupported = true;

            //store.verbosity = store.DEBUG;
            store.validator = Config.API_URL_BASE + "paymentGateways/google/payments?u=" + $scope.currUser.id;

            store.register({
                id: "lt.vertex.flirtas.purchase.vip",
                alias: "vip",
                type: store.PAID_SUBSCRIPTION
            });

            store.when("product").approved(function(product) {
                $ionicLoading.show({ template: __("Please wait") + '..'});
                product.verify();
            });

            store.when("product").verified(function(product) {
                $scope.currUser.isVip = true;
                $ionicLoading.hide();

                product.finish();

                $ionicPopup.alert({
                    title: __("Payment successful"),
                    template: __("Done - Thanks for buying VIP membership."),
                    buttons: [
                        { text: __("Cool, thanks!") }
                    ]
                });
            });

            store.ready(function() {
                $scope.purchaseOptions = [
                    {
                        buy: function() { store.order("vip"); },
                        cost: '€3',
                        numDays: 30
                    }
                ];
            });

            store.refresh();
        }
    })

    .controller('SettingsAlbumCtrl', function(
        $q, $rootScope, $scope, $stateParams, $ionicHistory, $ionicLoading, $ionicPopover,
        __, MediaFile, Album, Rule, ErrorCode
    ) {
        $scope.album = Album.get({
            id: $stateParams.albumId
        });

        $scope.photos = MediaFile.query({
            albumId: $stateParams.albumId,
            include: 'url(size=w80h80)'
        });

        $scope.zoomPhoto = function(photo) {
            $scope.popover.hide();

            // TODO
        };

        $scope.setAsMain = function(newMainPhoto) {
            $scope.popover.hide();

            newMainPhoto.isMain = true;

            $scope.photos.forEach(function(photo) {
                if (photo.isMain && photo.id != newMainPhoto.id) {
                    photo.isMain = false;
                }
            });

            newMainPhoto.$update({ isMain: true });
        };

        $scope.deletePhoto = function(photo) {
            $scope.popover.hide();

            var index = $scope.photos.indexOf(photo),
                photoToDelete = $scope.photos.splice(index, 1)[0];

            photoToDelete.$delete();
        };

        $scope.showOptionsFor = function(photo, $event) {
            $scope.selectedPhoto = photo;

            $ionicPopover.fromTemplateUrl('templates/popover_photo_options.html', {
                scope: $scope,
                animation: 'slide-in-up'

            }).then(function(popover) {
                $scope.popover = popover;
                popover.show($event);
            });
        };

        var filePicker;

        function uploadFile(fileData) {
            $ionicLoading.show({ template: __('Uploading') + '..' });

            var file = new MediaFile({
                albumId: $stateParams.albumId,
                file: fileData
            });

            // Upload the file
            file.$save({ previewThumbSize: 'w80h80' }).then(function(uploadResult) {
                // Fetch the info for the newly uploaded photo
                MediaFile.get({
                    albumId: $stateParams.albumId,
                    id: uploadResult.id,
                    include: 'url(size=w80h80)'

                }).$promise
                    .then(
                        function(newPhoto) { $scope.photos.push(newPhoto) },
                        $scope.onError
                    )
                    .finally(function() {
                        $ionicLoading.hide();
                    });

            }, function(error) {
                // Upload failed
                if (
                    error.status == 400
                    && error.data.rule
                    && error.data.rule.type == Rule.MIN_VALUE
                    && (error.data.rule.field == 'width' || error.data.rule.field == 'height')
                ) {
                    error.data.code = ErrorCode.IMAGE_SIZE_INVALID
                }

                var params = {};
                if (error.data && error.data.code == ErrorCode.ALREADY_DID_THAT) {
                    params.message = __("This file is already uploaded");
                }

                $scope.onError(error, params);
            });
        }

        $scope.$on('$ionicView.afterEnter', function() {
            filePicker = document.querySelector('ion-view[nav-view="active"] #file-picker');

            if (filePicker.hasAttribute('ready')) {
                // Was set-up already
                return;
            }

            filePicker.setAttribute('ready', 'true');
            filePicker.addEventListener('change', function(event) {
                uploadFile(event.target.files[0]);

                // Let's change the value of file input to null
                // Otherwise the onChange event wouldn't trigger if we tried uploading the same photo again.
                // For example, the user would do that if the first attempt failed because of some connectivity error
                filePicker.value = null;
            });
        });

        $scope.openFilePicker = function() {
            setTimeout(function() {
                ionic.trigger('click', { target: filePicker });
            }, 50);
        };

        $scope.deleteAlbum = function() {
            $scope.album.$delete();
            $rootScope.$broadcast('albumDeleted', $scope.album.id);
            $ionicHistory.goBack();
        };
    });