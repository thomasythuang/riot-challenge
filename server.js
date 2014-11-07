// server.js

// set up
var express 		= require('express');
var app 		= express(); 			// create app w/ express
var port 		= process.env.PORT || 9000; 	// set port

// express modules
var morgan 		= require('morgan');

// express config
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.use(morgan('dev')); 
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html'); 
//app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views'); 

// routes ======================================================================
//require('./app/routes.js')(app);
app.get('/', function(req, res){
	res.render('index.html');
});

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);
