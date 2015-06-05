var uuid = require('node-uuid');

exports.signin = function(req, res){
  console.log('signin username:' + req.body.username);
  req.session.username = req.body.username;
  req.session.uuid = uuid.v1();
  res.redirect('/motorcade');
};