export {}

console.log("Service worker running")

// chrome.webRequest.onBeforeRequest.addListener(
//     (details) => {
//         const tripsPattern = /\/v6\/trips.*/;
//         console.log(details)
//         if (tripsPattern.test(details.url)) {
//             console.log('Fetching', details.url)
//         }
//     },
//         {urls: ["<all_urls>"]}
// )
// // background.js
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//       if (request.response) {
//         console.log('Received response:', request.response);
//         // Perform further actions with the response if necessary
//       }
//     }
//   );

// background.js
// function windowChanger() {
//   window.alert('This is injected code')
// }
function monkeyPatch() {
  let oldXHROpen = window.XMLHttpRequest.prototype.open;

  window.XMLHttpRequest.prototype.open = function() {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === XMLHttpRequest.DONE) {
        console.log('Status:', this.status); // Log the status code

        const responseBody = this.responseText;
        if (responseBody) {
          try {
            const data = JSON.parse(responseBody);
            console.log('Data:', data);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            console.error('Received response:', responseBody);
          }
        } else {
          console.log('Response body is empty.');
        }
      }
    });

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