'use strict';

var firebase = require('firebase');

var config = {
  apiKey: "AIzaSyCGtFnKVUUd-BjjifwgHfla2N4F2CW3vyc",
  authDomain: "costestapp.firebaseapp.com",
  databaseURL: "https://costestapp.firebaseio.com",
  storageBucket: "costestapp.appspot.com",
  messagingSenderId: "695668699350"
};
firebase.initializeApp(config);

var database = firebase.database();

var titles = [];
var pids = [];
var pubs = [];
var tags = [];
var count = 0;
var specialChars = ".$#[]";

var request = require('request'),
  username,
  password,
  url = "https://api.osf.io/v2/nodes/?format=json",
  auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

request (
  {
    url : url,
    headers : {
      "Authorization" : auth
    }
  },
  function (error, response, body) {
    var data = JSON.parse(body);
    
    for ( var key in data ) {
      for ( var e in data[key] ) {
        if (data[key][e] != null) {

          var pid = data[key][e]['id'];
          if (pid  != null) {
            pids.push(pid);
            firebase.database().ref('projects/'+pid).set(
              pid
            );
        
            var title = data[key][e]['attributes']['title'];
            title = title.replace(/\./g, '');
            titles.push(title);

            var pub = data[key][e]['attributes']['public'];
            pubs.push(pub);

            var tag = data[key][e]['attributes']['tags'];
            tags.push(tag);

            count++;
          }
        }
      }
    }
    next();  
  }
)

var i = 0;
function next() {
  if (i < count) {
 
    request (
      {
        url : "https://api.osf.io/v2/nodes/"+pids[i]+"/contributors/?format=json",
        headers : {
          "Authorization" : auth
        }
      },
      function (error, response, body) {
        var data = JSON.parse(body);

        for ( var key in data ) {
          if (data[key] != null) {
          
            for (var j = 0; j<data[key].length; j++) {
              var pid = pids[i];
              var title = titles[i];
            
              // if only 1 contributor doesn't set title?  
              //console.log(pid)
              //console.log(title)

              var cname = data[key][j]['embeds']['users']['data']['attributes']['full_name'];
              cname = cname.replace(/\./g, '');

              if (j == 0) {
                firebase.database().ref('projects/'+pid+'/').set(
                  cname
                );
              }

              firebase.database().ref('projects/'+pid+'/title/').set(
                title
              );

              var per = data[key][j]['attributes']['permission'];
              firebase.database().ref('projects/'+pid+'/'+cname+'/').set({
                permissions: per
              });

              var pub = pubs[i];
              firebase.database().ref('projects/'+pid+'/public/').set(
                pub
              );

              var tag = tags[i];
              firebase.database().ref('projects/'+pid+'/tags/').set(
                tag
              );
            }
          }
        }
        i++;
        next();
      }
    )
  }
}
