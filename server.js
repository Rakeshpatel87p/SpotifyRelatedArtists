console.log('running!');
var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
        .qs(args)
        .end(function(response) {
            if (response.ok) {
                // How does response.body interact with the rest of the code?
                emitter.emit('end', response.body);
            } else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
}

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
        var originalArtist = item.artists.items;
        var artistId = item.artists.items[0].id;
        // Should this be located elsewhere?
        var searchReqTwo = getFromApi('artists/' + artistId + '/related-artists')

        searchReqTwo.on('end', function(item) {
            var artist = {
                // Original artist is not showing up. Why?
                art: originalArtist,
                related: item.artists

            };
            console.log(artist);
            res.json(artist);
        });

        searchReqTwo.on('error', function() {
            res.sendStatus(404);
        });
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });



});



app.listen(8080);
