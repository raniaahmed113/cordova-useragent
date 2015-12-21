angular.module('hotvibes', [
    'ionic','ionic.service.core',  'ionic.service.push',
    'ion-autocomplete', 'angularMoment', 'ngFabForm', 'ionic.contrib.ui.tinderCards', 'pascalprecht.translate',
    'hotvibes.config', 'hotvibes.routes', 'hotvibes.filters', 'hotvibes.controllers', 'hotvibes.services', 'hotvibes.directives'
])

    .constant('ErrorCode', {
        INVALID_CREDENTIALS: 100,
        NOT_ENOUGH_CREDITS: 101,
        VIP_REQUIRED: 102,
        PHOTO_IS_REQUIRED_HERE: 103,
        MEMBER_HAS_BLOCKED_YOU: 104,
        INVITE_ALREADY_SENT: 105,
        CANT_PERFORM_ACTION_ON_SELF: 106,
        TEXT_TOO_SHORT: 107,
        MUST_WAIT_FOR_REPLY: 108,
        IMAGE_SIZE_INVALID: 109

    })

    .constant('Rule', {
        MIN_VALUE: 'minValue'
    })

    .factory('SprintfInterpolator', function() {
        return {
            setLocale: function(locale) {},

            getInterpolationIdentifier: function() {
                return 'sprintf';
            },

            interpolate: function(string, interpolateParams) {
                if (!interpolateParams || interpolateParams.length < 1) {
                    return string;
                }

                var i = 0, prefix = '', suffix = '';
                var keys = Object.keys(interpolateParams);

                if (interpolateParams._before) {
                    keys.splice(keys.indexOf('_before'), 1);
                    prefix = interpolateParams._before;
                }

                if (interpolateParams._after) {
                    keys.splice(keys.indexOf('_after'), 1);
                    suffix = interpolateParams._after;
                }

                return string.replace(/%u|%s/g, function() {
                    var value = keys.length > i && !angular.isUndefined(interpolateParams[keys[i]])
                        ? interpolateParams[keys[i++]]
                        : '';

                    return prefix + value + suffix;
                });
            }
        };
    })

    .config(function(
        $stateProvider, $translateProvider, $urlRouterProvider, $httpProvider,
        $ionicConfigProvider, $resourceProvider/*, $cacheFactoryProvider*/,
        ngFabFormProvider
    ) {
        // Add HTTP interceptor so we could read/write headers on each request
        $httpProvider.interceptors.push('HttpInterceptor');

        // Dirty hack to annotate the keyword to be picked-up by the translation extractor
        // Since we can't use services at configuration stage
        var __ = function(i) { return i; };
        $ionicConfigProvider.backButton.text('<span translate>' + __('Back') + '</span>');

        $translateProvider.useSanitizeValueStrategy(null);
        $translateProvider.useInterpolation('SprintfInterpolator');
        $translateProvider.useStaticFilesLoader({
            prefix: 'i18n/',
            suffix: '.json'
        });
        $translateProvider.pluralForms({
            en: function(n) {
                return n != 1 ? 1 : 0;
            },
            lt: function(n) {
                return n%10==1 && n%100!=11 ? 0 : n%10>=2 && (n%100<10 || n%100>=20) ? 1 : 2;
            },
            lv: function(n) {
                return n%10==1 && n%100!=11 ? 0 : n != 0 ? 1 : 2;
            },
            pl: function(n) {
                return n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;
            },
            ru: function(n) {
                return n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;
            },
            hr: function(n) {
                return n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;
            }
        });

        /*var cache = $cacheFactoryProvider.$get()('resourceCache', { capacity: 100 });
        $resourceProvider.defaults.actions.get.cache = cache;*/
        $resourceProvider.defaults.actions.update = { method: 'PUT' };
        $resourceProvider.defaults.actions.query.interceptor = {
            response: function(response) {
                response.resource.$metadata = {
                    moreAvailable: (response.headers('X-Limit-MoreAvailable') ? true : false)
                };

                /*angular.forEach(response.resource, function(object) {
                    if (!object.id) {
                        return;
                    }

                    cache.put(response.config.url + '/' + object.id, object);
                });*/

                return response;
            }
        };

        ngFabFormProvider.extendConfig({
            validationsTemplate: 'templates/validation-messages.html'
        });

        ngFabFormProvider.setInsertErrorTplFn(function(compiledAlert, el, attrs) {
            var label = el.parent()[0].getElementsByClassName('input-label');
            if (label[0]) {
                label[0].appendChild(compiledAlert);

            } else {
                el.after(compiledAlert);
            }
        });
    })

    .run(function($injector, $ionicPlatform, $ionicModal, $translate, $rootScope, amMoment, AuthService, Config) {
        AuthService.init();

        var setLanguage = function(lang) {
            $translate.use(lang);

            if (lang == 'en') {
                lang = 'en-gb';
            }

            var script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', 'lib/moment/locale/' + lang + '.js');
            script.onload = function() {
                amMoment.changeLocale(lang);
            };
            document.getElementsByTagName("head")[0].appendChild(script);
        };

        if (Config.LANGUAGES.length === 1) {
            setLanguage(Config.LANGUAGES[0]);

        } else if (localStorage['selectedLocale']) {
            setLanguage(localStorage['selectedLocale']);

        } else {
            $translate.onReady(function() {
                var modalScope = $rootScope.$new();

                modalScope.changeLang = function(localeId) {
                    localStorage['selectedLocale'] = localeId;
                    setLanguage(localeId);
                    modalScope.modal.hide();
                };

                modalScope.languages = Config.LANGUAGES.map(function(lang) {
                    var DataMap = $injector.get('DataMap');

                    return {
                        id: lang,
                        title: DataMap.language[lang]
                    }
                });

                $ionicModal
                    .fromTemplateUrl('templates/select_language.html', {
                        scope: modalScope,
                        animation: 'slide-in-up'
                    })
                    .then(function(modal) {
                        modalScope.modal = modal;
                        modal.show();
                    });
            });
        }

        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            // TODO: show some message when device goes offline
            /*$ionicPlatform.on('offline', function() {

            });*/

            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    });