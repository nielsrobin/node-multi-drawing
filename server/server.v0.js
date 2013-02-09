var _ = require('underscore');

var io = require('socket.io').listen(8888);


var pieces = [];
var drawnPieces = [];

// should match client
var w = 50;
var h = 20;
var f = 16;
var c = 20;
var r = 5;

function init(){
	for(var i=0; i<c; i++)
	{
		for(var j=0; j<r; j++)
		{
			pieces.push({ id: i + "x" + j, x: i*w, y: j*h, src: "", drawn: false});
		}
	}
}
init();

io.sockets.on('connection', function (socket) {

	socket.on('init', function (name) {
		socket.set('name', name);
		socket.emit('pieces', pieces);
		
		socket.emit('people', io.sockets.manager.connected);
		socket.broadcast.emit('people', io.sockets.manager.connected);
	});

	socket.on('updatePiece', function (drawn) {
		_.each(pieces,function(piece, i){
			if(piece.id == drawn.id) 
			{
				pieces[i] = drawn;
			}
		});
		socket.broadcast.emit('updatePiece', drawn);
	});
	
  	socket.on('disconnect', function () {
		socket.broadcast.emit('people', io.sockets.manager.connected);
	});

});