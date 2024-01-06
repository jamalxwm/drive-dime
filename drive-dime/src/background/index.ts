export {}

console.log("Service worker running")





function monkeyPatch() {
  let oldXHROpen = window.XMLHttpRequest.prototype.open;
  const doorDashDeliveries = [
    { orderCreatedTime: '2024-01-01T23:31:58Z', deliveryTime: '2024-01-02T00:31:39Z' },
    { orderCreatedTime: '2024-01-01T23:24:28Z', deliveryTime: '2024-01-02T00:39:330Z' },
    { orderCreatedTime: '2024-01-01T01:51:33Z', deliveryTime: '2024-01-02T02:49:210Z' },
  ];

  function timeRangesOverlap(start1, end1, start2, end2) {
    // Convert all times to Date objects for comparison
    let startTime1 = new Date(start1);
    let endTime1 = new Date(end1);
    let startTime2 = new Date(start2);
    let endTime2 = new Date(end2);
  
    // Check if the time ranges overlap
    return startTime1 < endTime2 && endTime1 > startTime2;
  }
  // Extract the logging functionality into a separate function
  function processResponse(xhr, url) {
    if (xhr.readyState === XMLHttpRequest.DONE && url.startsWith('https://api.everlance.com/v6/trips')) {
      console.log('Status:', xhr.status);

      if (xhr.responseText) {
        try {
          const everlancetrips = JSON.parse(xhr.responseText);
          let matchedTrips = []

          if (Array.isArray(everlancetrips)) {
            everlancetrips.forEach(function(trip) {
              trip.dd_match_found = false;
              const tripStart = new Date(trip.started_at).toISOString()
              const tripEnd = new Date(trip.ended_at).toISOString()

              doorDashDeliveries.forEach(function(delivery) {
                if (timeRangesOverlap(tripStart, tripEnd, delivery.orderCreatedTime, delivery.deliveryTime)) {
                  trip.dd_match_found = true
                  matchedTrips.push(trip.token_id)
                  console.log('Match!', trip.token_id)
                }
              })
            })
            //console.log('Modified trips:', trips)
          }
          window.postMessage({type: "FROM_PAGE", text: "matches_found", data: matchedTrips}, "*")
          console.log('Modified trips:', matchedTrips)
        } catch (error) {
          console.error('Error parsing JSON:', error);
          console.error('Received response:', xhr.responseText);
        }
      } else {
        console.log('Response body is empty.');
      }
    }
  }

  window.XMLHttpRequest.prototype.open = function(method, url) {
    // Bind the 'this' context and the 'url' parameter to the logResponse function
    this.addEventListener('readystatechange', processResponse.bind(null, this, url));
    return oldXHROpen.apply(this, arguments);
  };
}

chrome.webNavigation.onCompleted.addListener(function(details) {
  // Check if the URL matches the pattern
  if (details.url.startsWith('https://dashboard.everlance.com/trips')) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      world: "MAIN",
      func: monkeyPatch,
    });
  }
}, {url: [{urlPrefix: 'https://dashboard.everlance.com/trips'}]})