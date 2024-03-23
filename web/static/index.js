let map;
var lat, lng;
async function initMap() {

  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  const {Map} = await google.maps.importLibrary("maps");
  map = new Map(document.getElementById("map"), {
    center: new google.maps.LatLng(53.3498, -6.2603),
    zoom: 13,
    disableDefaultUI: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_CENTER
    },
    styles:[
      {
          "featureType": "all",
          "stylers": [
              {
                  "saturation": 0
              },
              {
                  "hue": "#e7ecf0"
              }
          ]
      },
      {
          "featureType": "road",
          "stylers": [
              {
                  "saturation": -70
              }
          ]
      },
      {
          "featureType": "transit",
          "stylers": [
              {
                  "visibility": "off"
              }
          ]
      },
      {
          "featureType": "poi",
          "stylers": [
              {
                  "visibility": "off"
              }
          ]
      },
      {
          "featureType": "water",
          "stylers": [
              {
                  "visibility": "simplified"
              },
              {
                  "saturation": -60
              }
          ]
      }
  ]
    
  });

  if(navigator.geolocation)
  {
    navigator.geolocation.getCurrentPosition((position)=>{
        lat = parseFloat(position.coords.latitude);
        lng = parseFloat(position.coords.longitude);
        map.setCenter(new google.maps.LatLng(lat, lng));
        //marker for current location
        new google.maps.Marker({
          position: new google.maps.LatLng(lat, lng),
          map:map,
          icon: {
            url: 'https://img.icons8.com/color/48/marker--v1.png',
            scaledSize: new google.maps.Size(35, 35),
          }
        });
      }, null, options);
  }

  const stationsData = await GetStationsData();
  // const weatherData = await GetWeatherData();

  const input = document.getElementById("pac-input");            
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
        window.alert("No details available for input: '" + place.name + "'");
        return;
    }
    map.fitBounds(place.geometry.viewport);
    testingFunt(place) //testing 
    // console.log(place); // testing purposes 
    // getUserLocation(place);
    
  });

//function for testing purposes only 
function testingFunt(place){
  console.log("gbhjk")
  console.log(place.geometry.location);
  
}
// end of testing function 
  
  //marker for bike station locations
  for(var i=0; i< stationsData.length; i++)
  {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(stationsData[i].position.lat, stationsData[i].position.lng),
      map,
      icon:{
        url:"../static/bicycle-svgrepo-com.png",
        scaledSize: new google.maps.Size(35,35)
      }
    });
    AddInfoWindow(marker, map, stationsData[i]);
  }
}

function AddInfoWindow(marker, map, markerData)
{
  const bikeStationInfo = 
  ` <div class="stationsInfo">
    <h3 class="infoHeading">${markerData.name}</h3>
    <p class="info">Status: ${markerData.status}</p>
    <p class="info">Available Bikes: ${markerData.available_bikes}</p>
    <p class="info">Parking: ${markerData.available_bike_stands}</p>
    <p class="info">Banking: ${markerData.banking ? "Yes":"No"}</p>
    </div>`

  const infoWindow = new google.maps.InfoWindow({
    content:bikeStationInfo
  });

  //displaying information of bike station when the user hovers over the marker on map
  marker.addListener("mouseover", ()=>{
    infoWindow.open({
      anchor:marker,
      map
    });
  });

//closing information window when marker loses mouse focus
  marker.addListener("mouseout", ()=>{
    infoWindow.close();
  })
}

async function GetStationsData()
{
  const bikePromise = await fetch("https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey=9923c4b16f8c5fd842f2f448564bed43a349fa47", {mode:"cors"})
  bikesData = await bikePromise.json(); 
  // console.log(bikesData);
  return bikesData;
}

async function GetWeatherData()
{
  const weatherPromise = await fetch("http://api.weatherapi.com/v1/current.json?key=0f5a8ade5f024e70a34123035241602&q=dublin",{mode:"cors"});
  wData = await weatherPromise.json();
  return wData;
}

async function GetLatAndLang(lat, lng)
{
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  if(navigator.geolocation)
  {
    navigator.geolocation.getCurrentPosition((position)=>{
      lat = parseFloat(position.coords.latitude);
      lng = parseFloat(position.coords.longitude);
    }, null, options); 
  }
  findClosestStations(lat, lng, bikesData);
}

//function to find the 5 closest stations by lat, lng and return them in a list 
 function findClosestStations(lat, lng, stationsData) {
  if (!stationsData) {
    console.log('!!! stationsData is undefined or null !!!');
    return; // Exit the function if stationsData is not valid
    
 }
  
  
  const stationList = []; 
  // let stationsData = stationsData

 // Iterate over the stationsData object
 Object.entries(stationsData).forEach(([stationId, stationData]) => {
  let latDiff = stationData.position.lat - lat;
  let lngDiff = stationData.position.lng - lng;
  let distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // Store the station data and its distance from the given latitude and longitude
  stationList.push({station: stationData, distance: distance});
});
  console.log(stationList)
 
  // Sort by distance and take the first 5 closest //TODO im not sure this is sorting the right list
  distances.sort((a, b) => a.distance - b.distance);
  let closestStations = distances.slice(0, 5).map(item => item.station);
 
  // Return the closest stations
  return closestStations; //TODO check this is returning correct list?? 
 }



//popup for closest stations
function displayClosestStations(closestStations) {
    // Create a new div element
    let popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '10px';
    popup.style.right = '10px';
    popup.style.backgroundColor = '#fff';
    popup.style.border = '1px solid #000';
    popup.style.padding = '10px';
    popup.style.zIndex = '1000';
   
    // Populate the div with the station information
    closestStations.forEach(station => {
       let stationInfo = document.createElement('p');
       stationInfo.textContent = `Name: ${station.name}, Latitude: ${station.lat}, Longitude: ${station.lng}`;
       popup.appendChild(stationInfo);
    });
   
    // Append the div to the body
    document.body.appendChild(popup);
   }
  // Assuming findClosestStations is called and returns closestStations
let closestStations = findClosestStations(lat, lng);
displayClosestStations(closestStations);



//make window 

//list 5 stations on window 

//hover option to show details of each station 

