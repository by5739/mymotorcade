
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , auth = require('./routes/auth')
  , motorcade = require('./routes/motorcade')
  , http = require('http')
  , path = require('path')
  , uuid = require('node-uuid')
  , session = require('express-session')({
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true
    })
  , sharedsession = require("express-socket.io-session");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(session);
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
//登录拦截器，一定要在router之前
app.use(function (req, res, next) {
    var url = req.originalUrl;
    console.log("originalUrl:" + url);
    var accessUrls = {"/":"/", "/signin":"/signin", "/signout":"/signout"};
    if (!accessUrls[url] && !req.session.username) {
        return res.redirect("/");
    }
    next();
});
app.use(app.router);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/motorcade', motorcade.index);
app.post('/signin', auth.signin);

var server = http.createServer(app);

var sockets = {};

var io = require('socket.io')(server);
io.use(sharedsession(session));
io.on('connection', function(socket){
  console.log('a user connected, username is ' + socket.handshake.session.username);
  
  socket.emit("connected", {'id':socket.handshake.session.uuid, 'username': socket.handshake.session.username, 'points':sockets});
  
  socket.on('myLocation', function(data){
    //console.log(socket.id);
    data['uuid'] = socket.handshake.session.uuid;
    data['username'] = socket.handshake.session.username;
    sockets[socket.id] = data;
    socket.broadcast.emit('guyLocation', data);
  });
  
  socket.on('disconnect', function(){
    console.log('user disconnected，socket.id:' + socket.id + ' username:' + socket.handshake.session.username);
    if(sockets[socket.id]){
        socket.broadcast.emit('guyDown', {'uuid':socket.handshake.session.uuid});
    }
    delete sockets[socket.id];
  });
});

server.listen(app.get('port'), process.env.IP || "0.0.0.0", function(){
  console.log('Express server listening on port ' + app.get('port'));
});



