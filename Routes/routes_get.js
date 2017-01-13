"use strict";
let helper = require(__dirname + '/../helpers.js');
module.exports = {
  Router: function(app, connections){
      app.get('/', function (req, res) {
          res.render('pages/testSocket');
      });

    app.get('/testXama', function(req, res){
      res.render('pages/testSocket');
    });
  }
}
