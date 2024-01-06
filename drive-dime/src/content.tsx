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
  const table = document.querySelector('.w-full.table-fixed');
  let observerAndTimeout = {
    observer: null,
    timeoutId: null
  };

  if (!table) {
    console.log("Table not found, waiting to retry...");
    observerAndTimeout.timeoutId = setTimeout(() => observeTable(updateCallback), 500);
  } else {
    observerAndTimeout.observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          updateCallback();
        }
      }
    });

    observerAndTimeout.observer.observe(table, { childList: true, subtree: true });
  }

  // Return the object containing both the observer and the timeout ID
  return observerAndTimeout;
}

const updateUIWithMatches = (matchedTokens) => {
  matchedTokens.forEach(tokenID => {
    const selector = `button[id^="button-map-column_${tokenID}"]`

    let button = document.querySelector(selector)

    let row = button ? button.closest('tr'): null

    if (row) {
      row.classList.add('bg-green-200')
      let newCell = row.insertCell(-1)
      newCell.textContent = 'Match!'
    }
  })
  console.log("in the match function")
}

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