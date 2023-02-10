function addressAutocomplete(containerElement, callback, options) {

  const MIN_ADDRESS_LENGTH = 3;
  const DEBOUNCE_DELAY = 300;

  // create container for input element
  const inputContainerElement = document.createElement("div");
  inputContainerElement.setAttribute("class", "input-container");
  containerElement.appendChild(inputContainerElement);

  // create input element
  const inputElement = document.createElement("input");
  inputElement.setAttribute("type", "text");
  inputElement.setAttribute("placeholder", options.placeholder);
  inputContainerElement.appendChild(inputElement);

  // add input field clear button
  const clearButton = document.createElement("div");
  clearButton.classList.add("clear-button");
  addIcon(clearButton);
  clearButton.addEventListener("click", (e) => {
    e.stopPropagation();
    inputElement.value = '';
    callback(null);
    clearButton.classList.remove("visible");
    closeDropDownList();
  });
  inputContainerElement.appendChild(clearButton);

  /* We will call the API with a timeout to prevent unneccessary API activity.*/
  let currentTimeout;

  /* Save the current request promise reject function. To be able to cancel the promise when a new request comes */
  let currentPromiseReject;

  /* Focused item in the autocomplete list. This variable is used to navigate with buttons */
  let focusedItemIndex;

  /* Process a user input: */
  inputElement.addEventListener("input", function (e) {
    const currentValue = this.value;

    /* Close any already open dropdown list */
    closeDropDownList();


    // Cancel previous timeout
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    // Cancel previous request promise
    if (currentPromiseReject) {
      currentPromiseReject({
        canceled: true
      });
    }

    if (!currentValue) {
      clearButton.classList.remove("visible");
    }

    // Show clearButton when there is a text
    clearButton.classList.add("visible");

    // Skip empty or short address strings
    if (!currentValue || currentValue.length < MIN_ADDRESS_LENGTH) {
      return false;
    }

    /* Call the Address Autocomplete API with a delay */
    currentTimeout = setTimeout(() => {
      currentTimeout = null;

      /* Create a new promise and send geocoding request */
      const promise = new Promise((resolve, reject) => {
        currentPromiseReject = reject;

        // The API Key provided is restricted to JSFiddle website
        // Get your own API Key on https://myprojects.geoapify.com
        const apiKey = "bed8b866464f4b369ab39767ba49258d";

        var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(currentValue)}&format=json&limit=5&apiKey=${apiKey}`;

        fetch(url)
          .then(response => {
            currentPromiseReject = null;

            // check if the call was successful
            if (response.ok) {
              response.json().then(data => resolve(data));
            } else {
              response.json().then(data => reject(data));
            }
          });
      });

      promise.then((data) => {
        // here we get address suggestions
        currentItems = data.results;

        /*create a DIV element that will contain the items (values):*/
        const autocompleteItemsElement = document.createElement("div");
        autocompleteItemsElement.setAttribute("class", "autocomplete-items");
        inputContainerElement.appendChild(autocompleteItemsElement);

        /* For each item in the results */
        data.results.forEach((result, index) => {
          /* Create a DIV element for each element: */
          const itemElement = document.createElement("div");
          /* Set formatted address as item value */
          itemElement.innerHTML = result.formatted;
          autocompleteItemsElement.appendChild(itemElement);

          /* Set the value for the autocomplete text field and notify: */
          itemElement.addEventListener("click", function (e) {
            inputElement.value = currentItems[index].formatted;
            callback(currentItems[index]);
            /* Close the list of autocompleted values: */
            closeDropDownList();
          });
        });

      }, (err) => {
        if (!err.canceled) {
          console.log(err);
        }
      });
    }, DEBOUNCE_DELAY);
  });

  /* Add support for keyboard navigation */
  inputElement.addEventListener("keydown", function (e) {
    var autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
    if (autocompleteItemsElement) {
      var itemElements = autocompleteItemsElement.getElementsByTagName("div");
      if (e.keyCode == 40) {
        e.preventDefault();
        /*If the arrow DOWN key is pressed, increase the focusedItemIndex variable:*/
        focusedItemIndex = focusedItemIndex !== itemElements.length - 1 ? focusedItemIndex + 1 : 0;
        /*and and make the current item more visible:*/
        setActive(itemElements, focusedItemIndex);
      } else if (e.keyCode == 38) {
        e.preventDefault();

        /*If the arrow UP key is pressed, decrease the focusedItemIndex variable:*/
        focusedItemIndex = focusedItemIndex !== 0 ? focusedItemIndex - 1 : focusedItemIndex = (itemElements.length - 1);
        /*and and make the current item more visible:*/
        setActive(itemElements, focusedItemIndex);
      } else if (e.keyCode == 13) {
        /* If the ENTER key is pressed and value as selected, close the list*/
        e.preventDefault();
        if (focusedItemIndex > -1) {
          closeDropDownList();
        }
      }
    } else {
      if (e.keyCode == 40) {
        /* Open dropdown list again */
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        inputElement.dispatchEvent(event);
      }
    }
  });

  function setActive(items, index) {
    if (!items || !items.length) return false;

    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
    }

    /* Add class "autocomplete-active" to the active element*/
    items[index].classList.add("autocomplete-active");

    // Change input value and notify
    inputElement.value = currentItems[index].formatted;
    callback(currentItems[index]);
  }

  function closeDropDownList() {
    const autocompleteItemsElement = inputContainerElement.querySelector(".autocomplete-items");
    if (autocompleteItemsElement) {
      inputContainerElement.removeChild(autocompleteItemsElement);
    }

    focusedItemIndex = -1;
  }

  function addIcon(buttonElement) {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svgElement.setAttribute('viewBox', "0 0 24 24");
    svgElement.setAttribute('height', "24");

    const iconElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    iconElement.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");
    iconElement.setAttribute('fill', 'currentColor');
    svgElement.appendChild(iconElement);
    buttonElement.appendChild(svgElement);
  }

  /* Close the autocomplete dropdown when the document is clicked. 
    Skip, when a user clicks on the input field */
  document.addEventListener("click", function (e) {
    if (e.target !== inputElement) {
      closeDropDownList();
    } else if (!containerElement.querySelector(".autocomplete-items")) {
      // open dropdown list again
      var event = document.createEvent('Event');
      event.initEvent('input', true, true);
      inputElement.dispatchEvent(event);
    }
  });
}
var Dlatitude = 23.233323;
var Dlongitude = 72.651392;

var Slatitude = 23.233323;
var Slongitude = 72.651392;
addressAutocomplete(document.getElementById("autocomplete-container"), (data) => {
  console.log("Selected option: ");
  console.log(data);
  Dlatitude = data.lat;
  Dlongitude = data.lon;
  console.log(Dlatitude, Dlongitude);


}, {
  placeholder: "Enter Destination Address"
});




document.getElementById("para").onclick = function () {
  getLocation();
  // route(Slatitude, Slongitude,Dlatitude,Dlongitude);
};

var x = document.getElementById("para");
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  Slatitude = position.coords.latitude;
  fetch(`https://api.geoapify.com/v1/routing?waypoints=${Slatitude},${Slongitude}|${Dlatitude},${Dlongitude}&mode=drive&details=instruction_details&apiKey=1bf3fed7c7684f7f9f587c95fae779ad`).then(res => console.log("dev", res.json()));

  https://api.geoapify.com/v1/routing?waypoints=${Slat},${Slon}|${Dlat},${Dlon}&mode=drive&details=instruction_details&apiKey=1bf3fed7c7684f7f9f587c95fae779ad
  Slongitude = position.coords.longitude;
  route(Slatitude, Slongitude, Dlatitude, Dlongitude);
}

function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      x.innerHTML = "User denied the request for Geolocation."
      break;
    case error.POSITION_UNAVAILABLE:
      x.innerHTML = "Location information is unavailable."
      break;
    case error.TIMEOUT:
      x.innerHTML = "The request to get user location timed out."
      break;
    case error.UNKNOWN_ERROR:
      x.innerHTML = "An unknown error occurred."
      break;
  }
}























function route(Slat, Slon, Dlat, Dlon) {

  var map = L.map('my-map').setView([Slat, Slon], 10);

  const myAPIKey = "bed8b866464f4b369ab39767ba49258d";

  const isRetina = L.Browser.retina;

  const baseUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey={apiKey}";
  const retinaUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey={apiKey}";

  // Add map tiles layer. Set 20 as the maximal zoom and provide map data attribution.
  L.tileLayer(isRetina ? retinaUrl : baseUrl, {
    attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" rel="nofollow" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" rel="nofollow" target="_blank">© OpenStreetMap</a> contributors',
    apiKey: myAPIKey,
    maxZoom: 20,
    id: 'osm-bright',
  }).addTo(map);

  const fromWaypoint = [Slat, Slon]; // latutude, longitude
  const fromWaypointMarker = L.marker(fromWaypoint).addTo(map).bindPopup("1920 Quincy Street Northwest, Washington, DC 20011, United States of America");

  // to 38.881152,-76.990693 (1125 G Street Southeast, Washington, DC 20003, United States of America)
  const toWaypoint = [Dlat, Dlon]; // latitude, longitude
  const toWaypointMarker = L.marker(toWaypoint).addTo(map).bindPopup("1125 G Street Southeast, Washington, DC 20003, United States of America");


  const turnByTurnMarkerStyle = {
    radius: 5,
    fillColor: "#fff",
    color: "#555",
    weight: 1,
    opacity: 1,
    fillOpacity: 1
  }


  fetch(`https://api.geoapify.com/v1/routing?waypoints=${fromWaypoint.join(',')}|${toWaypoint.join(',')}&mode=drive&apiKey=${myAPIKey}`).then(res => res.json()).then(result => {

    // Note! GeoJSON uses [longitude, latutude] format for coordinates
    L.geoJSON(result, {
      style: (feature) => {
        return {
          color: "rgba(20, 137, 255, 0.7)",
          weight: 5
        };
      }
    }).bindPopup((layer) => {
      return `${layer.feature.properties.distance} ${layer.feature.properties.distance_units}, ${layer.feature.properties.time}`
    }).addTo(map);

    // collect all transition positions
    const turnByTurns = [];
    result.features.forEach(feature => feature.properties.legs.forEach((leg, legIndex) => leg.steps.forEach(step => {
      const pointFeature = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": feature.geometry.coordinates[legIndex][step.from_index]
        },
        "properties": {
          "instruction": step.instruction.text
        }
      }
      turnByTurns.push(pointFeature);
    })));

    let newTurns = []
    turnByTurns.map((data)=>{
      newTurns.push(data.geometry.coordinates);
    })

    var csv="";
    //create CSV file data in an array 
    // var array2D = [
    //                 [ "a" , "2"] ,
    //                 [ "c" ,"d" ]
    //               ];
     
    for (var index1 in newTurns) {
      var row = newTurns[index1];
       
      // Row is the row of array at index "index1"
      var string = "";
       
      // Empty string which will be added later
      for (var index in row) {
        // Traversing each element in the row
        var w = row[index];
         
        // Adding the element at index "index" to the string
        string += w;
        if (index != row.length - 1) {
          string += ",";
          // If the element is not the last element , then add a comma
        }
      }
      string += "\n";
       
      // Adding next line at the end
      csv += string;
      // adding the string to the final string "csv"
    }
    console.log(csv);







    // console.log(newTurns);
    // for (let i = 0; i <= turnByTurns.length; i++)
    //   // console.log(turnByTurns[i].geometry.coordinates)

    L.geoJSON({
      type: "FeatureCollection",
      features: turnByTurns
    }, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, turnByTurnMarkerStyle);
      }
    }).bindPopup((layer) => {
      return `${layer.feature.properties.instruction}`
    }).addTo(map);

  }, error => console.log(err));

}





document.getElementById("para2").onclick = function () {
  var url2 = `https://www.google.com/maps/dir/?api=1&origin=${Slatitude},${Slongitude}&destination=${Dlatitude},${Dlongitude}`;
  window.open(url2, '_blank');
};