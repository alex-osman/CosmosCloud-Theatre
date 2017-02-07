var express	= require("express");
var app		= express();
var fs = require('fs');
var util = require('util'),
			spawn = require('child_process').spawn,
			exec = require('child_process').exec,
			child;

var movie_folder = "assets/movies/"
var picture_folder = "assets/pictures/"
var doc_folder = "assets/docs/"
var music_folder = "assets/music/"

var isPlaying = false;
var currentlyPlaying = "none";
var pid;

var killOmxplayer = function() {
	exec('pkill -f omxplayer');
	isPlaying = false;
	currentlyPlaying = "none"
	pid = null;
}

var startOmxplayer = function(url) {
	exec('curl localhost:8080/on0')
	killOmxplayer();
	fs.writeFile('FIFO', '', function(err) {if (err) throw err;})
	pid = exec('omxplayer --vol -1800 -b -o local ' + url).pid;
	currentlyPlaying = url;
	isPlaying = true;
	console.log("Playing " + url);
}


var startStream = function(stream) {
	startOmxplayer("'" + stream + "'")
}

var startSong = function(song) {
	startOmxplayer(music_folder + song.replace(/ /g, '\\ '))
}

var startMovie = function(movie) {
	startOmxplayer(movie_folder + movie)
}

var dbus = function(params, callback) {
	console.log("dbus " + params.replace('_', ' '));
	exec('./omxplayer_dbus.sh ' + params.replace('_', ' '), function(err, stdout, stderr) {
		if (err)
			console.log(err);
		callback(stdout);
	})
}

//		api/dbus/getposition
//		api/dbus/setposition_89549154
//		api/dbus/setvolume_1.5

app.get('/api/dbus/:param', function(req, res) {
	dbus(req.params.param, function(data) {
		res.send(data)
	});
})

app.get('/api/stream/:url', function(req, res) {
	console.log("streaming " + req.params.url)
	startStream(req.params.url);
	res.send("ok1");
})

app.get('/api/music/:song', function(req, res) {
	startSong(req.params.song);
	res.send("ok2")
})

app.get('/api/movie/:movie', function(req, res) {
	startMovie(req.params.movie)
	res.send("ok3");
})

app.get('/api/status', function(req, res) {
	console.log("sending status");
	res.send(JSON.stringify({
		"isPlaying": isPlaying,
		"currentlyPlaying": currentlyPlaying,
		"pid": pid
	}));
})

app.listen(1337, '0.0.0.0');
console.log("Listening for traffic on 1337")
