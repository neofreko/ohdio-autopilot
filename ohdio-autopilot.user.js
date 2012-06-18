//==UserScript==
//@name Ohd.io
//@namespace  http://neofreko.com/
//@version    0.1
//@description  Autopilot playlist for Ohdio (https://github.com/neofreko/ohdio-autopilot)
//@include      http://ohd.io/*
//@copyright  2012+, Akhmad Fathonih
//@require https://raw.github.com/fxb/javascript-last.fm-api/master/lastfm.api.md5.js
//@require https://raw.github.com/fxb/javascript-last.fm-api/master/lastfm.api.cache.js
//@require https://github.com/neofreko/javascript-last.fm-api/raw/master/lastfm.api.js
//@require http://code.jquery.com/jquery-1.7.2.min.js
//==/UserScript==

/* Create a cache object */
var cache = new LastFMCache();

/* Create a LastFM object */
var lastfm = new LastFM({
    apiKey    : '814a8780d36924ce2941b3d453211dcf',
    apiSecret : '51ba653062842d2a6eceae165af61bf9',
    //cache     : cache; // causing troubles when lastfm func called within onPlaylistItem. undefined method: getObject
});

function isjwplayer() { return typeof unsafeWindow.jwplayer == 'function';}
function jwplayer() {return unsafeWindow.jwplayer();}
$(function () {
    var myChecker = setInterval(function () {
        if (isjwplayer()) {
            clearInterval(myChecker);
            initOhdioAddon();
        } else {
            console.log("waiting for jwplayer object: " + typeof unsafeWindow.jwplayer);
        }
    }, 1000);
});

//window.setTimeout(initOhdioAddon, 5000);
global_added = 0;

function searchAndAdd(artist) {
    $.ajax({
        url: 'http://ohd.io/api/v1/find',
        type: 'POST',
        dataType: 'json',
        data: {query: artist.name},
        success: function (data, status, xhr) {
            random_pick = Math.floor(Math.random()*data.data.length)
            console.log(global_added,'. adding ', data.data[0].song, ' into playlist');
            if (global_added++ < 5) {
                unsafeWindow.QueueControl.addTrack(data.data[0])
            }
        }
    });
}

unsafeWindow.handleSimilarArtist = function(data) {
            global_added = 0;
            console.log('similarartists:', data);
            if (typeof data.similarartists['@attr'] == 'object') { // last fm will return @track if it has similarity list
                // search the track in ohdio
                i = 0;
                for(i in data.similarartists.artist) {
                    console.log('searching ', data.similarartists.artist[i], ' in ohdio');
                    searchAndAdd(data.similarartists.artist[i]);
                    if (i>20)
                        break;
                }
            } else
                console.log('Aww, no similar tracks found');
        }

function initOhdioAddon() {
    console.log('Yay, Ohdio!');
    unsafeWindow.jwplayer().onPlaylistItem(function() { 
        //searchAndAdd('Mahameru')
        console.log('pass!');
        track = jwplayer().getPlaylistItem();
        console.log("will grep similar track or artist from last.fm. artist: ", track.song.artist, ' song: ', track.song.song);
        //console.log(track);
        lastfm.artist.getSimilar({artist: track.song.artist, limit: 20}, {success: unsafeWindow.handleSimilarArtist, error: function (code, message) {console.log('error', message )}})
    });
}

//console.log('unsafeWindow', typeof unsafeWindow);
unsafeWindow.lastfmFoo = function(data){
        console.log('debug', data);
    }
