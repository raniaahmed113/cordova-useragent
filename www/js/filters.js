var emojis = [
        'acute', 'aggressive', 'agree', 'air_kiss', 'angrybang', 'backbang', 'bad',
        'bananabang', 'bananadogy', 'bedbang', 'bedbang2', 'beee', 'biggrin', 'black_eye',
        'blum', 'blum2', 'blush', 'blush2', 'boast', 'bobiiespin', 'bomb', 'boobies',
        'boredom', 'bye', 'bye2', 'censored', 'clapping', 'congratulate', 'cool', 'cray',
        'cray2', 'd', 'dance', 'dance2', 'dance3', 'dance4', 'declare', 'derisive',
        'diablo', 'dirol', 'dntknw', 'doggy', 'don-t_mention', 'download', 'dream',
        'drinks', 'empathy', 'evildoggy', 'f', 'first_move', 'flag_of_truce', 'flashing',
        'flashme', 'fool', 'fool3', 'friends', 'girl_blum2', 'girl_cray2', 'girl_dance',
        'girl_devil', 'girl_drink1', 'girl_drink4', 'girl_hide', 'girl_in_love',
        'girl_pinkglassesf', 'girl_prepare_fish', 'girl_witch', 'good', 'good2', 'good3',
        'grannyflash', 'greeting', 'grin', 'handcufs', 'happybang', 'hardbang', 'heat',
        'help', 'hi', 'hysteric', 'i-m_so_happy', 'i_am_so_happy', 'ireful1', 'ireful2',
        'ireful3', 'kiss3', 'kissass', 'laugh2', 'laugh3', 'lazy', 'lazy2', 'lazy3', 'lol',
        'love', 'mad', 'mda', 'meeting', 'mocking', 'morning1', 'mosking', 'music', 'nea',
        'negative', 'new_russian', 'no2', 'nobang', 'noti', 'nyam1', 'offtopic', 'ok',
        'pardon', 'playboy', 'pleasantry', 'polling', 'popcorm1', 'popcorm2', 'punish',
        'punish2', 'read', 'resent', 'rofl', 'sad', 'scare', 'scare2', 'sclerosis', 'scratch',
        'search', 'secret', 'shab1', 'shab2', 'shab3', 'shok', 'shout', 'showerbang', 'smile',
        'smoke', 'snooks', 'sorry', 'sorry2', 'stink', 'stop', 'superstition', 'swoon',
        'swoon2', 'taunt', 'thank_you', 'thank_you2', 'this', 'threaten', 'timeout', 'to_clue',
        'to_take_umbrage', 'tongue', 'tripleass', 'triplebang', 'umnik', 'umnik2', 'victory',
        'whistle', 'whistle2', 'whistle3', 'wiener', 'wink3', 'wipme', 'yahoo', 'yes', 'yes2',
        'yes3', 'yes4', 'yu'
    ],
    rEmojis = new RegExp("\\((" + emojis.join("|") + ")\\)", "g");

angular.module('hotvibes.filters', [])

    .filter('capitalizeFirst', function() {
        return function(input) {
            return input[0].toUpperCase() + input.substring(1);
        }
    })

    .filter('concat', function() {
        return function(inputArray, separator) {
            if (!inputArray || !angular.isArray(inputArray)) {
                return inputArray;
            }

            if (!separator) {
                separator = ', ';
            }

            return inputArray.join(separator);
        }
    })

    .filter('profilePhotoUrl', function() {
        return function(photo, gender) {
            if (photo && photo.url) {
                return photo.url;
            }

            if (!gender || gender == 'male') {
                gender = 'generic';
            }

            return 'img/person-' + gender + '.png';
        }
    })

    .filter('translateProfileVal', function(DataMap, $translate) {
        var translateProfileVal = function(value, mapId) {
            if (angular.isObject(value)) {
                return Object.keys(value).map(function(element) {
                    return translateProfileVal(element, mapId);
                });
            }

            return DataMap[mapId][value]
                ? $translate.instant(DataMap[mapId][value])
                : value;
        };

        return translateProfileVal;
    })

    .filter('emoticonize', function() {
        return function(input) {
            if (!input) {
                return input;
            }

            return input.replace(rEmojis, function(match, text) {
                return '<img src="https://cdn.flirtas.lt/img/emoticons/' + text + '.gif" alt="" />';
            });
        };
    });