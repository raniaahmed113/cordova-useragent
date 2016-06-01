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
                if (
                    error.status == 400
                    && error.data.rule
                    && error.data.rule.type == Rule.MIN_VALUE
                    && (error.data.rule.field == 'width' || error.data.rule.field == 'height')
                ) {
                    error.data.code = ErrorCode.IMAGE_SIZE_INVALID
                }

                var params = {};
                if (error.data) {
                    switch (error.data.code) {
                        case ErrorCode.ALREADY_DID_THAT:
                            params.message = __("This file is already uploaded");
                            break;

                        case ErrorCode.LIMIT_REACHED:
                            params.message = __("File limit reached");
                            break;
                    }
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