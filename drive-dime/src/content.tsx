import { useEffect } from "react"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://dashboard.everlance.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function isTargetDate(dateString) {
  const targetDate = new Date('Dec 31, 2023');
  const cellDate = new Date(dateString);
  return cellDate.getTime() === targetDate.getTime();
}

// function isTimeInRange(startTimeString, endTimeString) {
//   const noon = new Date().setHours(12, 0, 0);
//   const eightPm = new Date().setHours(20, 0, 0);

//   const startTime = parseTime(startTimeString);
//   const endTime = parseTime(endTimeString);

//   return startTime >= noon && endTime <= eightPm;
// }

function parseTime(timeString) {
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier === 'pm' && hours !== 12) hours += 12;
  if (modifier === 'am' && hours === 12) hours = 0;

  return new Date().setHours(hours, minutes, 0);
}

const showHelloWorld = () => {
  const rows = document.querySelectorAll('.w-full.table-fixed tbody tr');
  rows.forEach((row) => {
    const dateCell = row.querySelector('td:nth-child(2) div');
    const timeCells = row.querySelectorAll('[data-testid="location-address"] span')
     //console.log(timeCells[0].textContent.trim())
    if (dateCell) {
      const dateString = dateCell.textContent.trim()
      
      if (isTargetDate(dateString)) {
        const newCell = document.createElement('td');
        newCell.textContent = 'Hello World';
        row.appendChild(newCell)
      }

    }
    
  });
};

const observeTable = () => {
  const table = document.querySelector('.w-full.table-fixed');
  if (!table) {
    console.log("Table not found, waiting to retry...");
    setTimeout(observeTable, 500);
    return;
  }

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName === 'TR') {
        showHelloWorld();
      }
    }
  });

  observer.observe(table, { childList: true, subtree: true });

  // Return the observer so it can be disconnected later
  return observer;
}

// content.js
// content.js - content script
// document.addEventListener('DOMContentLoaded', function () {
//   console.log('event listener call')
//   const originalXHRSend = XMLHttpRequest.prototype.send;
//   XMLHttpRequest.prototype.send = function(...args) {
//     // Keep a reference to the XMLHttpRequest instance
//     const xhr = this;

//     // Function to handle the response
//     function logResponse() {
//       if (xhr.readyState === 4 && xhr.status === 200) {
//         // Log the response text
//         console.log('XHR Response Body:', xhr.responseText);
//         // You can send the response body to the background script if needed
//         // chrome.runtime.sendMessage({response: xhr.responseText});
//       }
//     }

//     // Listen for the readystatechange event
//     this.addEventListener('readystatechange', logResponse, false);

//     // Call the original send method
//     originalXHRSend.apply(this, args);
//   };
// });

const PlasmoOverlay = () => {
  useEffect(() => {
    const observer = observeTable();

    // Clean up the observer on component unmount
    return () => {
      if (observer) {
        observer.disconnect();
      }
    }
  }, []);

  return (
    <div className="plasmo-z-50 plasmo-flex plasmo-fixed plasmo-top-32 plasmo-right-8">
      <h1>Wikipedia TLDR!!</h1>
    </div>
  )
}

export default PlasmoOverlay