var socket = io.connect("http://localhost:8888");

/* buttons */
var $cancel = $("#cancel");
var $brushes = $(".box canvas.brush");
var $colors = $(".color");
var $replay = $("#replay");
var $done = $("#done");
var $next = $("#next");
var $drawBTN = $("#draw-btn");
var $palette = $("#palette");
var $current = $("#current");
var $download = $("#download");
var $downloadFull = $("#download-full");
var $pieces = $("#pieces");
var $people = $("#people");

/* canvas (jq) */
var $draw = $("#draw");
var $drawFrom = $("#draw-from");
var $drawn = $("#drawn");
var $original = $("#original");
var $full;

/* canvases */
var draw = document.getElementById("draw");
var drawFrom = document.getElementById("draw-from");
var drawn = document.getElementById("drawn");
var original = document.getElementById("original");
var palette = document.getElementById('palette');

/* context */
var ctx = draw.getContext("2d");
var drawnctx = drawn.getContext("2d"); 
var dfctx = drawFrom.getContext("2d");
var pctx = palette.getContext("2d");

/* variables */
var dragging = false;
var brush = { 
	size: 8,
	color: "black"
}
var replay = [];
var img = new Image();
var pieces = [];
var ic = 0;
var piece;
var people = {};

// should match server
var w = 50;
var h = 20;
var f = 12;
var c = 20;
var r = 5;

$draw.attr("width",w*f);
$draw.attr("height",h*f);
$drawFrom.attr("width",w*f);
$drawFrom.attr("height",h*f);

$drawn.attr("width",w*c);
$drawn.attr("height",h*r);
$original.attr("width",w*c);
$original.attr("height",h*r);

var imgTemp = new Image();
var imgPalette = new Image();

/* functions */
function init(){
	$(".box canvas").each(function(){
		var ctx = $(this)[0].getContext("2d");
		
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		
		ctx.beginPath();
		ctx.lineWidth = $(this).attr("data-size");  
		ctx.strokeStyle = brush.color;
		ctx.moveTo(16,16);
		ctx.lineTo(16,16+1);
		ctx.stroke();
	});
	
	img.onload = function(){
		original.getContext("2d").drawImage(img, 0, 0);
	}
	img.src = "img/bracelet.jpg";
	
	imgPalette.onload = function(){
		palette.getContext("2d").drawImage(imgPalette, 0, 0, 572, 428, 0, 0, 374, 188);
	}
	imgPalette.src = 'img/atari-palette.png';
	
	socket.emit('init', "robin");
}
init();


socket.on('pieces', function (data) {
	pieces = _.shuffle(data);
	loadStats();
	
	_.each(data,function(drawn){
		if(drawn.drawn)
		{
			var imgNew = new Image();
			imgNew.onload = function(){	
			    drawnctx.drawImage(imgNew, 0, 0, w*f, h*f, drawn.x, drawn.y, w, h);
			}
			imgNew.src = drawn.src;
		}
	});
});

socket.on('people', function (data) {
	people = data;
	loadStats();
});

socket.on('updatePiece', function (drawn) {
	_.each(pieces,function(p, i){
		if(p.id == drawn.id) 
		{
			pieces[i] = drawn; 
			
			if(drawn.drawn)
			{
				var imgNew = new Image();
				imgNew.onload = function(){	
				    drawnctx.drawImage(imgNew, 0, 0, w*f, h*f, drawn.x, drawn.y, w, h);
				}
				imgNew.src = drawn.src;
		    }
		    else
		    {
				drawnctx.clearRect(drawn.x, drawn.y, w, h);
		    }
		}
	});
	loadStats();
});


$drawBTN.click(function () {
    getNextPiece();
    togglePanes();
});

$next.click(function () {
    saveImage();

    window.setTimeout(function () {
        getNextPiece();
    }, 200);
});

$done.click(function () {
    saveImage();
    togglePanes();
	loadStats();
});

draw.addEventListener('selectstart', function (e) { e.preventDefault(); return false; }, false);

function mdown(e,t) {
	e.preventDefault();
	
	var x = e.pageX - t.offsetLeft;
	var y = e.pageY - t.offsetTop;
	
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	
	ctx.beginPath();
	ctx.lineWidth = brush.size;  
	ctx.strokeStyle = brush.color;
	ctx.moveTo(x,y);
	ctx.lineTo(x,y+1);
	ctx.stroke();
	dragging = true;
	
	//replay.push(ctx.getImageData(0, 0, w*f, h*f));
}
draw.addEventListener('mousedown', function(e) { mdown(e,this); }, true);
draw.addEventListener('touchstart', function(e) { mdown(e,this); }, true);

function mmove(e,t) {
	e.preventDefault();
	if(dragging)
	{
		var x = e.pageX - t.offsetLeft;
		var y = e.pageY - t.offsetTop;
		
		ctx.lineTo(x,y);
		ctx.stroke();
		
		//if(ic % 5 == 0) replay.push(ctx.getImageData(0, 0, w*f, h*f));	
		//ic++;
	}
}
draw.addEventListener('mousemove', function(e) { mmove(e,this); }, true);
draw.addEventListener('touchmove', function(e) { mmove(e,this); }, true);

draw.addEventListener('mouseup', function() { dragging = false; }, true);
draw.addEventListener('touchend', function() { dragging = false; }, true);

$cancel.click(function () {
	piece.drawn = false;
	socket.emit('updatePiece', piece);
	
	togglePanes();
	loadStats();
});

$brushes.click(function(){
	brush.size = $(this).attr("data-size");
	dragging = false;
});

$colors.click(function(){
	brush.color = $(this).css("background-color");
	dragging = false;
});

$replay.click(function(){
	var fps = 10;
	var i = 0;
	var myInterval = setInterval(function()
	{
	    ctx.putImageData(replay[i], 0, 0);
	
	    i++;
	    if (i == replay.length)
	    {
	        clearInterval(myInterval);
	    }
	}, 1000 / fps);
});

$palette.click(function(e){
		var x = e.pageX - this.offsetLeft;
		var y = e.pageY - this.offsetTop;
		
		var data = pctx.getImageData(x, y, 1, 1).data;
		brush.color = "rgb(" + data[0] + "," + data[1] + "," + data[2] + ")";
		$current.css("background-color","rgb(" + data[0] + "," + data[1] + "," + data[2] + ")");
});

$download.click(function(){
	window.location = drawn.toDataURL();
});

$downloadFull.click(function(){
	
	if($full == undefined)
	{
		$('body').append("<canvas id='full' width='12000' height='1200'></canvas>");
		$full = $("#full");
	}
	var fctx = $full[0].getContext("2d");
	
	_.each(pieces,function(p){
		if(p.drawn)
		{
			var imgNew = new Image();
			imgNew.onload = function(){	
			    fctx.drawImage(imgNew, 0, 0, w*f, h*f, p.x*f, p.y*f, w*f, h*f);
			}
			imgNew.src = p.src;
		}
	});

});

$drawn.click(function(e){
	var x = e.pageX - this.offsetLeft;
	var y = e.pageY - this.offsetTop;
	
	x -= (x % w);
	y -= (y % h);
	drawnctx.clearRect(x, y, w, h);
	
	_.each(pieces,function(d, i){
		if(d.x == x && d.y == y) 
		{
			pieces[i].drawn = false;
			pieces[i].src = "";
			piece = pieces[i]; 
		}
	});
	
	socket.emit('updatePiece', piece);
	loadStats();
});

function loadStats()
{
	$people.text(Object.keys(people).length + " people drawing.");
	
	var i = 0;
	_.each(pieces,function(p){
		if(p.drawn == false) i++;
	});
	
	$pieces.text(i + " pieces left.");
}


function togglePanes() {
    $("#main-box").toggle();
    $("#draw-box").toggle();
}

function getNextPiece() {
	piece = _.find(pieces, function(p){ return p.drawn == false; });
	_.each(pieces,function(p, i){
		if(p.id == piece.id) 
		{
			pieces[i].drawn = true;
			socket.emit('updatePiece', pieces[0]);
		}
	});
	
	replay = [];
	dfctx.drawImage(img, piece.x, piece.y, w, h, 0, 0, w*f, h*f);
    ctx.clearRect(0, 0, w*f, h*f);
}

function saveImage() {
    piece.src = draw.toDataURL();
    
    imgTemp.onload = function(){
    	_.each(pieces,function(p,i){
    		if(piece.id == p.id)
    		{
    			pieces[i] = piece;
				drawnctx.drawImage(imgTemp, 0, 0, w*f, h*f, piece.x, piece.y, w, h);
				socket.emit('updatePiece', piece);
    		}
    	});
    }
    imgTemp.src = piece.src;
}