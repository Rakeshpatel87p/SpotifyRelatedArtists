console.log('running!');
var unirest = require('unirest');
var express = require('express');
var events = require('events');
var fs = require('fs');

var getFromApi = function(endpoint, args) {
        var emitter = new events.EventEmitter();
        unirest.get('https://api.spotify.com/v1/' + endpoint)
            .qs(args)
            .end(function(response) {
                emitter.emit('end', response.body);
            });
        return emitter;
    }
    // Don't declare these until later.

var app = express();
// What is this doing?
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        progress = 0;
        var artist = item.artists.items[0],
            artistId, getRelatedArtists;
        // var searchedForArtistId = item.artists.items[0].id;
        // How does this work?

        if (!artist) {
            console.log('Artist not found!');
            res.sendStatus(404);
            return
        }

        artistID = artist['id'];
        var getRelatedArtists = getFromApi('artists/' + artistID + '/related-artists')
            // var getTopTracks = getFromApi('artists/' + artistId + '/top-tracks')
        getRelatedArtists.on('end', function(item) {
            var numArtists = item.artists.length;
            console.log('numArtists', numArtists);
            // Why put this in a seperate function?
            function complete() {
                if (progress === numArtists) {
                    artist.related = item.artists;
                    console.log('hey');
                    console.log('PROGRESS', progress);
                    res.json(artist);
                    return;
                }
            };

            var getTopTracks = function(artist) {
                var topTrackReq = getFromApi('artists/' + artist.id + '/top-tracks?country=US');

                topTrackReq.on('end', function(topTracksItem) {
                    artist.tracks = topTracksItem.tracks;
                    progress++;
                    complete();
                });

                topTrackReq.on('error', function() {
                    res.sendStatus(404);
                });
            };
            // for (var i = 0; i <= item.artists.length - 1; i++) {
            item.artists.forEach(function(artist) {
                getTopTracks(artist);
                // console.log('TOP-TRACKS', artist.topTracks);            
            });

            getRelatedArtists.on('error', function() {
                res.sendStatus(404);
            });

        })

        searchReq.on('error', function() {
            console.log('Nope');
            res.sendStatus(404);
        });


    });

});

// getRelatedArtists.on('error', function() {
//     res.sendStatus(404);
// });
// searchReq.on('error', function(code) {
//     res.sendStatus(code);
// });


app.listen(8080);
