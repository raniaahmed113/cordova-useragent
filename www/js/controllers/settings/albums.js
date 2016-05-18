angular.module('hotvibes.controllers')

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
    });