angular.module('hotvibes.controllers')

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
            $scope.currUser.profilePhoto = newMainPhoto;
        };

        $scope.deletePhoto = function(photo) {
            $scope.popover.hide();

            var index = $scope.photos.indexOf(photo),
                photoToDelete = $scope.photos.splice(index, 1)[0];

            photoToDelete.$delete().finally(function() {
                if (photoToDelete.isMain) {
                    $scope.currUser.refresh();
                }
            });
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

        $scope.upload = function(fileData) {
            $ionicLoading.show({ template: __('Uploading') + '..' });

            var file = new MediaFile({
                albumId: parseInt($stateParams.albumId),
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
                        function(newPhoto) {
                            $scope.photos.push(newPhoto);

                            if (newPhoto.isMain) {
                                $scope.currUser.profilePhoto = newPhoto;
                            }
                        },
                        $scope.onError
                    )
                    .finally(function() {
                        $ionicLoading.hide();
                    });

            }, function(error) {
                // Upload failed
                var params = {};

                switch (error.status) {
                    case 400: // Bad Request
                        if (!error.data) {
                            break;
                        }

                        if (error.data.rule
                            && error.data.rule.type == Rule.MIN_VALUE
                            && (error.data.rule.field == 'width' || error.data.rule.field == 'height')
                        ) {
                            error.data.code = ErrorCode.IMAGE_SIZE_INVALID;
                            break;
                        }

                        switch (error.data.code) {
                            case ErrorCode.ALREADY_DID_THAT:
                                params.message = __("This file is already uploaded");
                                break;

                            case ErrorCode.LIMIT_REACHED:
                                params.message = __("File limit reached");
                                break;
                        }
                        break;

                    case 415: // Unsupported Media Type
                        params.message = __("Incorrenct file extention");
                        break;
                }

                $scope.onError(error, params);
            });
        };

        $scope.deleteAlbum = function() {
            $scope.album.$delete();
            $rootScope.$broadcast('albumDeleted', $scope.album.id);
            $ionicHistory.goBack();
        };
    });