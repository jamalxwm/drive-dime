import { useEffect, useState } from "react"
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
const MAX_RETRIES = 5 // Sets the maximum retry limit
let retryCounts = new Map() // Use a map to track number of retries for each token

const getRowToUpdate = (tokenID) => {
  const selector = `button[id^="button-map-column_${tokenID}"]`;
  let button = document.querySelector(selector);

  if (button) {
    console.log("in the forEach method");
    return button.closest('tr');
  }
  return null
}

const updateUIWithMatches = (matchedTokens) => {
  console.log(`in the match function with ${matchedTokens.size} tokens`);
  
  // Iterate over matched tokens to find the correct row to update
  matchedTokens.forEach(tokenID => {
    const row = getRowToUpdate(tokenID)
    const retries = retryCounts.get(tokenID) || 0 // Get the retry count or default to 0

      if (row) {
        if (!row.querySelector('.match-cell')) { // Check if the cell is already added
          row.classList.add('bg-green-200');
          let newCell = row.insertCell(-1);
          newCell.textContent = 'Match!';
          newCell.classList.add('match-cell'); // Add a class to mark this cell
          console.log('painted', tokenID);
        }
        retryCounts.delete(tokenID)
      } else if (retries < MAX_RETRIES){
      console.log(`Row not found for token ${tokenID}, retrying...`);
      retryCounts.set(tokenID, retries + 1)
      // Retry after a short delay
      setTimeout(() => updateUIWithMatches(new Set([tokenID])), 1000);
    } else {
      console.log(`Maximum retries reached for tokenID ${tokenID}, not retrying.`)
      retryCounts.delete(tokenID)
    }
  });
};

const PlasmoOverlay = () => {
  const [matchedTokens, setMatchedTokens] = useState(new Set())

  const updateCallback = (addedNodes) => {
    addedNodes.forEach(node => {
      // Assuming that added nodes are TR elements, process each one
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TR') {
        // Do something with the added TR elements
        // You would call your updateUIWithMatches here
        const button = node.querySelector('button[id^="button-map-column_"]');
        if (button) {
          const tokenID = button.id.replace('button-map-column_', '')
          if (matchedTokens.has(tokenID)) {
            updateUIWithMatches(matchedTokens)
          }
        }       
      }
    });
  };
  
  const observeTable = (updateCallback) => {
    const tableSelector = '.w-full.table-fixed';
    const table = document.querySelector(tableSelector);
    let observerAndTimeout = {
      observer: null,
      timeoutId: null
    };
  
    const observerCallback = (mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Pass the added nodes to the callback for processing
          updateCallback(Array.from(mutation.addedNodes));
        }
      }
    };
  
    if (!table) {
      console.log("Table not found, waiting to retry...");
      observerAndTimeout.timeoutId = setTimeout(() => observeTable(updateCallback), 500);
    } else {
      observerAndTimeout.observer = new MutationObserver(observerCallback);
      observerAndTimeout.observer.observe(table, { childList: true, subtree: true });
      console.log("Table observer has been set up.");
    }
  
    return observerAndTimeout;
  };
  
  useEffect(() => {
    document.head.appendChild(getStyle())
    const handleMessage = (event) => {
      if (event.source === window && event.data.type && event.data.type === "FROM_PAGE") {
        console.log('Content script received message:', event.data.text)
        const newTokens = event.data.data
        console.log(newTokens)
        setMatchedTokens(currentMatchedTokens => {
          const updatedMatchedTokens = new Set(currentMatchedTokens);
          newTokens.forEach(token => {
            updatedMatchedTokens.add(token);
          });
          updateUIWithMatches(updatedMatchedTokens)
          return updatedMatchedTokens;
        });  
      }
    }

    window.addEventListener("message", handleMessage, false)
    const observerAndTimeout = observeTable(() => updateUIWithMatches(matchedTokens))
    // Clean up the observer on component unmount
    return () => {
      window.removeEventListener("message", handleMessage, false)
      if (observerAndTimeout.timeoutId) {
        clearTimeout(observerAndTimeout.timeoutId);
      }
      if (observerAndTimeout.observer) {
        observerAndTimeout.observer.disconnect();
      }
    }
  }, []);

  return (
    null
  )
}

export default PlasmoOverlay