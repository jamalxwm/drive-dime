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

// Example updateCallback function that processes added nodes
const updateCallback = (addedNodes) => {
  addedNodes.forEach(node => {
    // Assuming that added nodes are TR elements, process each one
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TR') {
      // Do something with the added TR elements
      // You would call your updateUIWithMatches here
      const selector = `button[id^="button-map-column_${tokenID}"]`;
      let button = document.querySelector(selector);
    }
  });
};

// Set up the table observer
observeTable(updateCallback);

const updateUIWithMatches = (matchedTokens) => {
  console.log(`in the match function with ${matchedTokens.length} tokens`);
  
  matchedTokens.forEach(tokenID => {
    const selector = `button[id^="button-map-column_${tokenID}"]`;
    let button = document.querySelector(selector);

    if (button) {
      console.log("in the forEach method");
      let row = button.closest('tr');

      if (row) {
        if (!row.querySelector('.match-cell')) { // Check if the cell is already added
          row.classList.add('bg-green-200');
          let newCell = row.insertCell(-1);
          newCell.textContent = 'Match!';
          newCell.classList.add('match-cell'); // Add a class to mark this cell
          console.log('painted', tokenID);
        }
      }
    } else {
      console.log(`Button with selector ${selector} not found, retrying...`);
      // Retry after a short delay
      setTimeout(() => updateUIWithMatches([tokenID]), 500);
    }
  });
};

const PlasmoOverlay = () => {
  useEffect(() => {
    document.head.appendChild(getStyle())
    const handleMessage = (event) => {
      if (event.source === window && event.data.type && event.data.type === "FROM_PAGE") {
        console.log('Content script received message:', event.data.text)
        
        updateUIWithMatches(event.data.data)
      }
    }

    window.addEventListener("message", handleMessage, false)
    const observerAndTimeout = observeTable(() => updateUIWithMatches([]))
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
    <div/>
  )
}

export default PlasmoOverlay