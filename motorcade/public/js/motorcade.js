Zepto(function($){
  
  var map = new BMap.Map("l-map");  
  map.centerAndZoom(new BMap.Point(116.404, 39.915), 14);  
  map.enableScrollWheelZoom(true);
  
  var genMarker = function(lng, lat, label){
    var marker = new BMap.Marker(new BMap.Point(lng, lat));
    if(label){
      marker.setLabel(new BMap.Label(label));
    }
	  
    return marker;
  }
  
  var markers = {};
  var uuid,username;
  var socket = io();
  socket.on('connected', function(data){
    //alert('fetch username')
    uuid = data.id;
    username = data.username;
    if(data.points){
      for(var key in data.points){
        var point = data.points[key];
        markers[point.uuid] = genMarker(point.lng, point.lat, point.username);
        map.addOverlay(markers[point.uuid]);
      }
    }
    
    getMyLocation(function(){
      //alert('setViewport');
      map.setViewport(getMapValues(markers, function(marker){return marker.getPosition();}));
      setInterval(getMyLocation,30000);//1000为1秒钟
    });
  });
  
  socket.on('guyLocation', function(data){
    if(markers[data.uuid]){
      map.removeOverlay(markers[data.uuid]);
    }
    markers[data.uuid] = genMarker(data.lng, data.lat, data.username);
    map.addOverlay(markers[data.uuid]);
  });
  
  socket.on('guyDown', function(data){
    if(markers[data.uuid]){
      map.removeOverlay(markers[data.uuid]);
      delete markers[data.uuid];
    }
  });
  
  var getMapValues = function(map, fn){
    var arr = [];
    if(map){
      for(key in map){
        arr.push(fn(map[key]));
      }
    }
    return arr;
  }
  
  var getMyLocation = function(cb){
    var geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
      if(this.getStatus() == BMAP_STATUS_SUCCESS){
        map.removeOverlay(markers[uuid]);
        
        markers[uuid] = genMarker(r.point.lng, r.point.lat, username);
        map.addOverlay(markers[uuid]);

        //map.panTo(r.point);
        //alert('您的位置：'+r.point.lng+','+r.point.lat); 
        
        socket.emit('myLocation', {'lng' : r.point.lng, 'lat' : r.point.lat});
        
        if(cb)
          cb();
      }
      else {
        alert('failed'+this.getStatus());
      }        
    },{enableHighAccuracy: true});

  }
  
  

})
