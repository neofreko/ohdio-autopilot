//==UserScript==
//@name Ohd.io
//@namespace  http://neofreko.com/
//@version    0.1
//@description  enter something useful
//@include      http://ohd.io/*
//@copyright  2012+, You
//@require https://raw.github.com/fxb/javascript-last.fm-api/master/lastfm.api.md5.js
//@require https://raw.github.com/fxb/javascript-last.fm-api/master/lastfm.api.cache.js
//@require https://github.com/neofreko/javascript-last.fm-api/raw/master/lastfm.api.js
//@require http://code.jquery.com/jquery-1.7.2.min.js
//==/UserScript==

/* Create a cache object */
var cache = new LastFMCache();

/* Create a LastFM object */
var lastfm = new LastFM({
    apiKey    : 'f21088bf9097b49ad4e7f487abab981e',
    apiSecret : '7ccaec2093e33cded282ec7bc81c6fca',
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

function searchAndAdd(track_title) {
    $.ajax({
        url: 'http://ohd.io/api/v1/find',
        type: 'POST',
        dataType: 'json',
        data: {query: track_title},
        success: function (data, status, xhr) {
            console.log('adding ', data.data[0].song, ' into playlist')
            unsafeWindow.QueueControl.addTrack(data.data[0])
        }
    });
}

unsafeWindow.handleSimilarTrack = function(data) {
            console.log('similartracks:', data);
            if (typeof data.similartracks['@track'] == 'object') { // last fm will return @track if it has similarity list
                // search the track in ohdio
                i = 0;
                for(simtrack in data.similartracks.track) {
                    console.log('searching ', simtrack.name, ' in ohdio');
                    searchAndAdd(simtrack);
                    if (i>5)
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
        try {
            lastfm.track.getSimilar({artist: track.song.artist, track: track.song.song}, {success: unsafeWindow.handleSimilarTrack})
        } catch (e) {
            console.log('exception on lastfm.track.getSimilar: ', e);
        }
    });
}

//console.log('unsafeWindow', typeof unsafeWindow);
unsafeWindow.lastfmFoo = function(data){
        console.log('bon jovi', data);
    }
    
//lastfm.track.getSimilar({artist: 'Bon Jovi', track: 'Santa fe'}, {success: unsafeWindow.lastfmFoo});
