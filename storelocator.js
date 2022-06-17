const state = {
  map: null,
  geocode_result: null,
  geometry: {
    address: [
      {
        lat: 23.885942,
        lng: 45.079162,
      },
      {
        lat: parseFloat(40.0028579),
        lng: parseFloat(21.5930031),
      },
      {
        lat: parseFloat(21.2790277),
        lng: parseFloat(39.6902353),
      },
    ],
  },
  request: {
    query_one: {
      query: "Alshiaka الشياكة",
      fields: ["formatted_address", "opening_hours", "geometry"],
    },
    query_text: {
      location: null, // set on flay
      query: "alshiaka",
      // radius: "10",
    },
  },
  instances: {
    place_service: null,
    geocoder: null,
  },
};

function addMarker(options) {
  return new google.maps.Marker(options);
}

function setPlaceServiceAPIInstance(map) {
  state.instances["place_service"] = new google.maps.places.PlacesService(map);
}

function setGeocoderAPI() {
  state.instances["geocoder"] = new google.maps.Geocoder();
}

function getPlaceServiceAPI() {
  if (state.instances["place_service"] !== null) {
    return state.instances["place_service"];
  }
  return new google.maps.places.PlacesService(state.map);
}

function newInstancePlace()
{
   return new google.maps.places.PlacesService(state.map);

}

function getGecode() {
  return state.instances["geocoder"] !== null
    ? state.instances["geocoder"]
    : new google.maps.Geocoder();
}
// a way to transform to class

var initMap = new Promise(function (resolve, reject) {
  try {
    const map = new google.maps.Map(document.getElementById("kh_map"), {
      zoom: 4,
      center: state.geometry.address[0], // mecca
    });

    addMarker({
      map: map,
      position: state.geometry.address[0],
    });

    state.map = map; // set state

    resolve(map); // alwas depned on resloved value form init and not excute any function unlsee a state of map had fullfilments @khalil
  } catch (err) {
    reject(err);
  }
});

const init = () => {
  triggerEvent("before_init");

  initMap
    .then(function (resloved) {
      setPlaceServiceAPIInstance(resloved);
      setGeocoderAPI();
      return true;
    })
    .catch((err) => console.log(err));

  state.initlized = true;
  triggerEvent("after_init");
};

// window.init = init ; no need unless we call a callback to api request

window.onload = function () {
  //   console.log("laoded"); 
  init();

  if (state.hasOwnProperty("initlized") && state.initlized) {
    // cahce variables
    const select = document.querySelector("[data-location-selector]");
    triggerEvent("after_state_check");

    // safly code here all dependcy neeede are loaded and good to go
    // Map , Gecoder and Place APIS are ready to use

    /**
     * Start  coding :  geting user selected value
     *  actions [getValue , setValueOfState]
     */
    state.queryString = getSelectedValue(select);

    /**
     * Gecode address
     * It perform a promis request and set the sate to store resolved valui
     */

    geocodeAddress("Abha").then(function (resloved) {
      
      state.geocode_result = resloved;
       
     
      state.geocode_result_resolved = true; 
    });

    // wait for gecode compelete
    const watchResolve = setInterval(function () {
      // replace with proxy and watch for object change @next
      if (
        state.hasOwnProperty("geocode_result_resolved") &&
        "geocode_result_resolved" in state &&
        state.geocode_result !== undefined
      ) {
        // safly start request to places api and muniblite cordnitse
        // at this point or stage state holds the value of geocode addres function also all instances are ready to use
        // Note: this funciton only excute once as a first render to mimec the presedures required to achive all steps
        console.log(
          "Ready to make a place api request with gecoded address",
          //state.geocode_result
        );

        // parse the address to make a request query
        //const location =  parseGecodeAddres(state.geocode_result);

        getPlaceServiceAPI().nearbySearch(
          {
            keyword: "Alshiaka الشياكة",
            location: getLatLngFromState(),
            radius: "50000",
          },
          function (results, status) {
            // console.log(status);
            // console.log(results);
           results.map((store , i) => {
            if('opening_hours' in store) {
               const {opening_hours} = store
               console.log(store)
               new google.maps.Marker({
                  position:{
                     lat:store.geometry.location.lat(),
                     lng:store.geometry.location.lng(),
                  },
                  map:state.map,
                  title:`${store.name}`
               })
            }
            

           })
           state.map.fitBounds(getBoundsFromState())
         } 
        );

        clearInterval(watchResolve);
      }
    }, 100);

    // Listen for selcte chage select
    select.addEventListener("change", function (e) {
      // const restriec = new google.maps.places.LocationRestriction(state.geocode_result[0].geometry.location.bounds);
      geocodeAddress(getSelectedValue(e.target)).then((resolved) => {
      //   getPlaceServiceAPI().textSearch(
      //     {
      //       bounds: state.geocode_result.geometry.bounds,
      //       query: "alshiaka",
      //       LocationRestriction: state.geocode_result.geometry.bounds,
      //     },
      //     function (r, s) {
      //       console.log(r);
      //       console.log(s);
      //       state.map.fitBounds(state.geocode_result.geometry.bounds);
      //     }
      //   );

       getPlaceServiceAPI().nearbySearch( 
          { 
            keyword: "Alshiaka الشياكة",
            location: getLatLngFromState(),
            radius: "5000",
          }, 
          function (result, status) {
            console.log("neadtbay search", result);
            console.log(status);
          }
        );

        getPlaceServiceAPI().nearbySearch(
         {
           keyword: "alshiaka",
           location:{
            lat:resolved.geometry.location.lat(),
            lng:resolved.geometry.location.lng()
           },
           radius: "5000",
         },
         function (results, status) {
           console.log( "resolive", status);
           console.log(results);
         }
       );

       
      

        const rect = new google.maps.Rectangle({
          bounds: getBoundsFromState(),
          map: state.map,
        });
      });
      // console.log(getSelectedValue(e.target))
    });
  }
}; 

function getSelectedValue(el) {
  if (el.tagName === "SELECT") {
    return el.options[el.selectedIndex].value;
  }
}

function geocodeAddress(query) {
   
  return getGecode()
    .geocode({ address: query })
    .then(function (resolved) {
      const {results: [data]} = resolved ;

      state.geocode_result = data;
      
      console.log(data)
      return data;
    });
}

function getBoundsFromState() {
    const {geometry :{bounds}}  = state.geocode_result ;
    return bounds ;
}

function getLatLngFromState() {
  const {
    geometry: { location },
  } = state.geocode_result;
  return {
    lat: location.lat(),
    lng: location.lng(),
  };
}

function triggerEvent(event) {
  const ev = new Event(event);
  document.dispatchEvent(ev);
}

function setState(value) {
  // This is a huage thing to implmement for now LEAVE IT FOR LATTER;
}

/***
 * @first get query string from selecte value
 * @second gecode query
 * @third  ge
 * @todo : Restrice search only for a given bound || Retrun only the places in a given address
 * @todo : Create marker for returedn results on map
 * @todo : List all return stores on cared bellow map elemens
 *
 * Steps
 * - User select an addreess from select elements and the address are from our side to enter
 * - get the selected address value from selected element
 * - gecode selectd value to lat and lng cordinated , bounds (Pan geocoaded location to map)
 * - get the gecode cordiniates [LatLng || bound] in order to use to resrict search to the give cordintes
 * - make a request to PlaceAPI with a query payloaed with :
 *            [
 *             query @string : selected address ,
 *             location @number | @float : from gecode result,
 *             Bounds @number | @float : from gecode result
 *             raduis : @string : a given amount should be change by setting default will be 30 miles
 *           ]
 *
 * - resolved resutl for PlaceAPI request will be a set of json data and here onther aproach of steps
 * - create markets on map for founded locations
 * - crete cards of information for resloved locations
 *
 * @todo : after all done make a nearby search based on user location
 */

document.addEventListener("before_init", function (e) {
  console.log("before init");
});
document.addEventListener("after_init", function (e) {
  console.log("after init");
});
document.addEventListener("after_state_check", function (e) {
  console.log("after state check ");
});
