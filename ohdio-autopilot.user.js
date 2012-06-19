//==UserScript==
//@name Ohd.io
//@namespace  http://neofreko.com/
//@version    0.1
//@description  Autopilot playlist for Ohdio (https://github.com/neofreko/ohdio-autopilot)
//@include      http://ohd.io/*
//@copyright  2012+, Akhmad Fathonih
//@require https://raw.github.com/fxb/javascript-last.fm-api/master/lastfm.api.md5.js
//@require https://raw.github.com/fxb/javascript-last.fm-api/master/lastfm.api.cache.js
//-require http://localhost/lstfm.js
//@require https://github.com/neofreko/javascript-last.fm-api/raw/master/lastfm.api.js?nocachepuhlease
//@require http://code.jquery.com/jquery-1.7.2.min.js
//==/UserScript==

/* Create a cache object */
var cache = new LastFMCache();
apiKey = '814a8780d36924ce2941b3d453211dcf';
apiSecret = '51ba653062842d2a6eceae165af61bf9';
global_username = prompt('For scroblling function, Ohd.io autopilot needs your last.fm username');
global_password = prompt('For scroblling function, Ohd.io autopilot needs your last.fm password');;
global_session = null;
global_added = 0;
global_manual_play = 0;

/* Create a LastFM object */
var lastfm = new LastFM({
    apiKey    : apiKey,
    apiSecret : apiSecret,
    //cache     : cache; // causing troubles when lastfm func called within onPlaylistItem. undefined method: getObject
});

/*token = /token=(.*?)(&.*)?$/.exec(location.search);
console.log('haz token', token)
    alert('stop');
if (token) {
    // 
    lastfm.auth.getSession({token: token[1]}, function(data) {
        console.log('session?',data);
    })
} else
    // init web auth
    GM_openInTab('http://www.last.fm/api/auth/?api_key=' + apiKey);
*/

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

function searchAndAdd(artist) {
    $.ajax({
        url: 'http://ohd.io/api/v1/find',
        type: 'POST',
        dataType: 'json',
        data: {query: artist.name},
        success: function (data, status, xhr) {
            console.log('search result: ', data)
            if (data.data.length == 0)
                return;
            random_pick = Math.floor(Math.random()*data.data.length)
            console.log('about to add ', data.data[random_pick].song, 'using random number', random_pick, 'out of', data.data.length)
            if (global_added < 2 && !unsafeWindow.isInQueue(data.data[random_pick])) {
                global_added++;
                console.log(global_added,'. adding ', data.data[random_pick].song, ' into playlist');
                
                unsafeWindow.QueueControl.addTrack(data.data[random_pick])
                if (unsafeWindow.QueueControl.data.length>10)
                    unsafeWindow.QueueControl.removeTrack(0)
            }
        }
    });
}

unsafeWindow.isInQueue = function(data) {
    console.log(data);
    for (i=0;i<unsafeWindow.QueueControl.data.length;i++) {
        //console.log('comparing', unsafeWindow.QueueControl.data[i], data)
        if (unsafeWindow.QueueControl.data[i].file == data.file) {
            console.log(data.song, 'already in queue')
            return true;
        }
    }
    return false;
}
    
unsafeWindow.handleSimilarArtist = function(data) {
            global_added = 0;
            console.log('similarartists:', data);
            if (typeof data.similarartists['@attr'] == 'object') { // last fm will return @track if it has similarity list
                // search the track in ohdio
                i = 0;
                for(i=0;i<20;i++) {
                    random_pick = Math.floor(Math.random()*data.similarartists.artist.length)
                    console.log('searching ', data.similarartists.artist[random_pick], ' in ohdio');
                    searchAndAdd(data.similarartists.artist[random_pick]);
                }
            } else
                console.log('Aww, no similar tracks found');
        }

unsafeWindow.handlePlayItem = function() { 
        //searchAndAdd('Mahameru')
        console.log('pass!');
        track = jwplayer().getPlaylistItem();
        console.log("will grep similar track or artist from last.fm. artist: ", track.song.artist, ' song: ', track.song.song);
        //console.log(track);
        lastfm.artist.getSimilar({artist: track.song.artist, limit: 20}, 
                                 {success: unsafeWindow.handleSimilarArtist, error: function (code, message) {console.log('error', message )}})
        global_manual_play = 0; // reset so onPlay can respond to track changes
}

function initOhdioAddon() {
    console.log('Yay, Ohdio!');
    unsafeWindow.jwplayer().onPlaylistItem(function(){global_manual_play = 1; unsafeWindow.handlePlayItem()})
        .onPlay(function() {
            track = jwplayer().getPlaylistItem();
            console.log('Update now playing on last.fm:', track)
                lastfm.track.updateNowPlaying({artist: track.song.artist, track: track.song.song, album: track.song.album}, global_session, 
                                              {success: unsafeWindow.lastfmFoo, error: unsafeWindow.lastfmError})
            console.log('Scrobbling:', track)
                lastfm.track.scrobble([{'artist': track.song.artist, 'track': track.song.song, 'timestamp': Math.round((new Date()).getTime() / 1000)}], global_session, 
                                              {success: unsafeWindow.lastfmFoo, error: unsafeWindow.lastfmError})
        });
}

//console.log('unsafeWindow', typeof unsafeWindow);
unsafeWindow.lastfmFoo = function(data){
        console.log('debug', data);
    }
    
unsafeWindow.lastfmError = function(code, message){
        console.log('error', code, message);
    }
//GM_log(lastfm.auth.getMobileSession)
    lastfm.auth.getMobileSession({username: global_username, password: global_password}, {
        success: function (data) {
            global_session = data.session;
            console.log('got session:', global_session)
    }, 
        error: unsafeWindow.lastfmError})
