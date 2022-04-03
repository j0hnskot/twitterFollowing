chrome.runtime.onInstalled.addListener(() => {
    const filter = {
        url: [
          {
            urlMatches: 'https://twitter.com/*',
          },
        ],
      };
      
      chrome.webNavigation.onCompleted.addListener(() => {
         start();        
      }, filter);
  });


  async function start() {
    const tabId = await getTabId();
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["main.js"],
    });
  }
  
  function getTabId() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0].id);
      });
    });
  }
  
  
  