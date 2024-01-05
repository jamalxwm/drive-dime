import { useState, useEffect } from "react"

function IndexPopup() {
 const [currentUrl, setCurrentUrl] = useState<string>("")

 const getCurrentUrl = async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    setCurrentUrl(tab.url)
 }

 useEffect(() =>{
    getCurrentUrl()
 }, [currentUrl])
  
 return (
    <div
      style={{
        display: 'flex',
        padding: 16
      }}>
      <h1>
      You are currently at {currentUrl}
      </h1>
      
    </div>
 )
}

export default IndexPopup