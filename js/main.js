var public_spreadsheet_url = 'https://docs.google.com/spreadsheet/pub?key=0Ao3Ts9D8bHHpdDQ4RzMzQ0pLTmJ6OUh6UVBNbkFPc3c&output=html';

var frozenDist;
var freeze=0;
var MDHouseDistricts = {};
var app = {};
var houseLayer;
var latitude = 38.82;
var longitude = -77.28;
var latLng = new L.LatLng(latitude, longitude);
var sidebar = $('#sidebar');
var map = L.map('map')
  .setView(latLng, 8);
//    .fitBounds([
//  [38, -78],
//  [39, -74.125]
//    [40.712, -74.227],
//  [40.774, -74.125]
//])
//  ;

$(document).ready( function() {
  Tabletop.init( { key: public_spreadsheet_url,
    callback: showInfo,
    parseNumbers: true } );
});

function showInfo(data, tabletop) {
  var defaultText =$("#template-default-text").html();
  var sourcebox = $("#template-infobox").html();
  app.infoboxTemplate = Handlebars.compile(sourcebox);
  app.defaultTemplate = Handlebars.compile(defaultText);

  $.each( tabletop.sheets("MD 2014 Endorsements").all(), function(i, member) {

    MDHouseDistricts[member.district] = member;
  });

  console.log("MDHouseDistricts", MDHouseDistricts);
  loadGeo();
//     processJSON(tabletop.sheets("Sheet1").all());
}
var geoStyle = function(data) {
//   console.log('data', data);
  console.log('-------------------');
//   console.log('MDHouseDistricts',MDHouseDistricts);
  var sldlst = data.properties.SLDLST;
  sldlst = sldlst.replace(/^0+/, '');
//   var convertedSLDLST = Number(sldlst);
//   if(convertedSLDLST){
//    sldlst = convertedSLDLST;
//   }
  //console.log(sldlst);
  //console.log('-------------------');

  var houseDistrict = MDHouseDistricts[sldlst];
  console.log('houseDistrict', houseDistrict);

  var color = 'white';
  var opacity = .50;

  if(houseDistrict) {
    color = houseDistrict.colormethod;
    if (color =="#FFFFBF") {
      console.log(color);
//      color= '#ffe9c3';
      color= '#fff4c1';
//      color = '#FFCD76';
    }
//    color='#0B8973';
  }
console.log('housedistrict.....', houseDistrict.district);
  if (houseDistrict.district==43 ) {
    opacity = 0.1;
  }

  return {
    fillColor: color,
    weight: 1,
    opacity: opacity,
    color: '#555555',
    dashArray: '0',
    fillOpacity: 1
  }
};

function loadGeo(district) {
  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 17,
    minZoom:8,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mroswell.i6hfjp09'
  }).addTo(map);
  //'examples.map-9ijuk24y'

  houseLayer = L.geoJson(mdHouse, {
    onEachFeature:onEachFeature,
    style: geoStyle
  });

  houseLayer.addTo(map);
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: mapMemberDetailClick,
    dblclick: mapDblClick
  });
}



function highlightFeature(e) {
  var layer = e.target;
  var districtNumber = layer.feature.properties.SLDLST;
  districtNumber = districtNumber.replace(/^0+/, '');
  var memberDetail = MDHouseDistricts[districtNumber];
  if(!memberDetail){
    console.log(districtNumber);
    return;
  }
  var html;

//  console.log("highlightFeature: ", layer);

  html = "<div class='highlightFeatureInfo'>";
  html += "<strong> District " + memberDetail.district + "</strong>";
  html += "</div>";

  $('.info').html(html);


  if (!freeze) {
    html = app.infoboxTemplate(memberDetail);
    $('#sidebar').html(html);

    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.5
    });

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
    info.update(layer.feature.properties);
  }
}



function resetHighlight(e) {
  var layer = e.target;
  houseLayer.resetStyle(layer);
  info.update();
  if (!freeze) {
    clearInfobox();
  }
// else {
//    if (layer == frozenDist) {
//    layer.setStyle({
//      weight: 5,
//      color: 'orange',
//      dashArray: '',
//      fillOpacity: 0.4
//    });
//  }
//  }
}

function clearInfobox() {
  sidebar.html(' ');
}

function mapMemberDetailClick(e) {
  freeze=1;
  var boundary = e.target;
  frozenDist = _.clone(boundary);
  console.log("FrOZEN", frozenDist);
  var districtNumber = boundary.feature.properties.SLDLST.replace(/^0+/, '');
  console.log("mapMemberDetailClick: ", districtNumber);
  var member = memberDetailFunction(districtNumber);
  console.log("::::::",e);
  console.log(boundary.getBounds().toBBoxString());

  boundary.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.4
  });
}

function memberDetailFunction(districtNumber){
  var districtDetail = MDHouseDistricts[districtNumber];
  // 1. Build Template for the information box from districtDetails attributes.
  var html = app.infoboxTemplate(districtDetail);
  // 2. Insert the rendered template into #sidebar
  $('#sidebar').html(html);

}

function mapDblClick(e) {
  var layer = e.target;
  var districtNumber = layer.feature.properties.SLDLST;
  districtNumber = districtNumber.replace(/^0+/, '');

  var bbox = layer.getBounds();
  console.log("bbox",bbox);
  map.fitBounds(bbox);
  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.3
  });
  console.log("DBL", bbox.toBBoxString())
  mapMemberDetailClick(e);
}

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};
//   // method that we will use to update the control based on feature properties passed
info.update = function (props) {
};

//new L.Control.Zoom({ position: 'topright' }).addTo(map);


info.setPosition('bottomleft').addTo(map);

$("button").click(function() {
  var html = app.defaultTemplate({});
  $('#sidebar').html(html);
  freeze=false;
});

$("button").hover(function() {
  var html = app.defaultTemplate({});
  $('#sidebar').html(html);
  freeze=false;
});
$(document).on("click",".close",function(event) {
  event.preventDefault();
  clearInfobox();
  freeze=0;
});
