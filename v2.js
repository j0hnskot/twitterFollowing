const UIRemovalDelay = 100;
const followDelay = 500;
const delayForRefresh = 1500;
const randomDelay = 3000;
const deepSleepDelay = 60000;

let debug = true;

const userCellQuery = 'div [data-testid*="UserCell"]';
const followerQuery = "//span[contains(., 'Follows you')]";
const unfollowPopupQuery = "[data-testid='confirmationSheetConfirm']";
const followButtonQuery = 'div [aria-label*="Follow "]';
const followingButtonQuery = 'div [aria-label*="Following @"]';
const unfollowButtonIDQuery = 'div[data-testid*="-unfollow"]';
const followButtonIDQuery = 'div[data-testid*="-follow"]';
const defaultTwitterImage = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png';
const rateLimitError =  '[href="https://support.twitter.com/articles/66885"]';

let stopRunning = false;

const storedFollowers = getStoredFollowers();

const panelDiv = document.createElement('div');
panelDiv.setAttribute('style', 'position: fixed; bottom: 0; left: 0; width: 100%; height: 50px; background-color: #f5f5f5;');
document.body.appendChild(panelDiv);

const saveFollowingBtn = document.createElement("button"); 
saveFollowingBtn.innerText = "Save Original Following List";
saveFollowingBtn.onclick = saveOriginalFollowingList;
saveFollowingBtn.setAttribute('style', 'background-color: #fff; border: 1px solid #ccc; padding: 10px;');
panelDiv.appendChild(saveFollowingBtn);

const followBtn = document.createElement("button"); 
followBtn.innerText = "Start Following";
followBtn.onclick = start;
followBtn.setAttribute('style', 'background-color: #fff; border: 1px solid #ccc; padding: 10px;');
panelDiv.appendChild(followBtn);

const unfollowBtn = document.createElement("button"); 
unfollowBtn.innerText = "Start Unfollowing";
unfollowBtn.onclick = unfollow;
unfollowBtn.setAttribute('style', 'background-color: #fff; border: 1px solid #ccc; padding: 10px;');
panelDiv.appendChild(unfollowBtn);

const stopBtn = document.createElement("button"); 
stopBtn.innerText = "Stop";
stopBtn.onclick = _ => { stopRunning = true; };
stopBtn.setAttribute('style', 'background-color: #ff00; border: 1px solid #ccc; padding: 10px;');
panelDiv.appendChild(stopBtn);

const debugButton = document.createElement("button"); 
debugButton.innerText = "Debug is" + (debug ? " on" : " off");
debugButton.setAttribute('style', 'background-color:' + (debug ? '#008000' : '#FF0000 ') + '; border: 1px solid #ccc; padding: 10px;');
debugButton.onclick = () => {
    debug = !debug;
    debugButton.innerText = "Debug is" + (debug ? " on" : " off");
    debugButton.setAttribute('style', 'background-color:' + (debug ? '#008000' : '#FF0000 ') + '; border: 1px solid #ccc; padding: 10px;');
};
panelDiv.appendChild(debugButton);

const deepSleepText = document.createElement("span"); 
deepSleepText.innerText = "Deep Sleep is on - wait for " + deepSleepDelay / 1000 + " seconds";
deepSleepText.setAttribute('style', 'color: white; background-color: #FF0000; border: 1px solid #ccc; padding: 10px;');
deepSleepText.style.display = 'none';
panelDiv.appendChild(deepSleepText);


async function start() {
  while (!stopRunning && await follow());
  stopRunning = false; 
}

function getOriginalFollowingList() {
    const originalFollowingList = JSON.parse(localStorage.getItem('originalTwitterFollowingList'));
    return originalFollowingList || [];
}

async function saveOriginalFollowingList() {
    
    if(!window.location.pathname.includes('/following')) {
        window.location.href = 'https://twitter.com/following';
        return
    }

    const originalFollowingList = [];
   
    let originalFollowingListDiv = []
    
    while((originalFollowingListDiv = document.querySelectorAll(unfollowButtonIDQuery)) && originalFollowingListDiv.length){
 
        for (const e of originalFollowingListDiv) {
            originalFollowingList.push(e.getAttribute('data-testid').split('-')[0]);
            e.closest(userCellQuery).remove();
            await sleep(UIRemovalDelay);
        }
    }

    const valueToStore =  JSON.stringify(originalFollowingList)
     
    const  currentValue = JSON.parse(localStorage.getItem('originalTwitterFollowingList'));
    if (currentValue === null || currentValue.length === 0) {
        localStorage.setItem('originalTwitterFollowingList', valueToStore); 
    }

    saveStringToJSONFile(valueToStore);
}

function saveStringToJSONFile(valueToStore) {
    const c = document.createElement("a");
    c.download = valueToStore;
    const t = new Blob([valueToStore], {
        type: "application/json"
    });
    c.href = window.URL.createObjectURL(t);
    c.click();
    c.remove();
}

async function follow() {
  
  stopIfNoOriginalList();
  await removeAlreadyFollowing();
  await removeAlreadyFollowed();
  await removeInactive();
  
  const toFollow = document.querySelectorAll(userCellQuery);

  if (toFollow.length === 0) {
    return;
  }

  for (const personDiv of toFollow) {
    if(stopRunning) return false;
    
    if (!debug) {
       await pressFollowButton(personDiv);
    }
     
    saveFollower(personDiv);
    await sleep(followDelay);
    personDiv.remove();
  }

  return true;
}

async function pressFollowButton(personDiv) {
   const button = personDiv.querySelector(followButtonQuery);
   if(!button) return;
   button.click();

   await sleep(followDelay)
   while(checkForAPIRateLimitError()){
       await enterDeepSleep();
   }
}

async function enterDeepSleep() {
    deepSleepText.style.display = 'inline';
    await sleep(deepSleepDelay);
    deepSleepText.style.display = 'none';
}

async function pressUnfollowButton(personDiv) {
    const button =  personDiv.querySelector(unfollowButtonIDQuery);
    if(!button) return;
    button.click();

    await sleep(followDelay)
    while(checkForAPIRateLimitError()){
        await sleep(deepSleepDelay);
    }
}

function checkForAPIRateLimitError() {
    const error = document.querySelector(rateLimitError);
    return error; 
}

async function unfollow() {
    stopIfNoOriginalList();

    let alreadyFollowed = document.querySelectorAll(
        followingButtonQuery
    );

      while (
        (alreadyFollowed = document.querySelectorAll(
            followingButtonQuery
        )) &&
        alreadyFollowed.length
        && !stopRunning
      ) {
        for (const unfollowBtn of alreadyFollowed) {
          if(stopRunning) return false;
        
          const personDiv = unfollowBtn.closest(userCellQuery)
          const personID = getPersonID(personDiv);
          if(personID === null) continue;
            
          if(!isPersonIDInOriginalList(personID) && !debug) {
            await pressUnfollowButton(personDiv);
            const unfollowPopupOpen = document.querySelector(
                unfollowPopupQuery
              );
            if (unfollowPopupOpen) unfollowPopupOpen.click();
            await sleep(followDelay);
          }

          personDiv.remove(); 

        }
    
        await sleep(delayForRefresh);
      }

}

function isPersonIDInOriginalList(personID) {
    const originalFollowingList = getOriginalFollowingList();
    if(originalFollowingList.includes(personID)){
        console.log(`${personID} is in the original list`);
        return true;
    }

    return false;
}


async function removeAlreadyFollowing() {

  const xPathResult = document.evaluate(
    followerQuery,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );

  const alreadyFollowing = [];
  let node = xPathResult.iterateNext();
  while (node) {
    alreadyFollowing.push(node);
    node = xPathResult.iterateNext();
  }

  for (const e of alreadyFollowing) {
    e.closest(userCellQuery).remove();
    await sleep(UIRemovalDelay);
  };

}

async function removeAlreadyFollowed() {

  let alreadyFollowed = document.querySelectorAll(
    followingButtonQuery
  );
  while (
    (alreadyFollowed = document.querySelectorAll(
        followingButtonQuery
    )) &&
    alreadyFollowed.length
    && !stopRunning
  ) {
    for (const personDiv of alreadyFollowed) {
      personDiv.closest(userCellQuery).remove();
      await sleep(UIRemovalDelay);
    }
  }
}

async function removeInactive() {

    const inactive = document.querySelectorAll('img[src*="' + defaultTwitterImage + '"]');
    for (const e of inactive) {
        e.closest(userCellQuery).remove();
        await sleep(UIRemovalDelay);
    }
}

function getStoredFollowers() {
    const storedFollowers = localStorage.getItem('twitterFollowers');
    if (storedFollowers) {
        return JSON.parse(storedFollowers);
    }
    return {};
}

function saveFollower(followerDiv) {
 
    const followerID = getPersonID(followerDiv)
    storedFollowers[followerID] = {
            "date":  Date.now()
    };
    localStorage.setItem('twitterFollowers', JSON.stringify(storedFollowers));
}

function getPersonID(personDiv) {
    const followBtn = personDiv.querySelector(followButtonIDQuery) || personDiv.querySelector(unfollowButtonIDQuery);
    
    if(followBtn === null) return null;

    return followBtn.getAttribute('data-testid').split('-')[0];
}

async function sleep(ms, extraRandomMS = false) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms + (extraRandomMS ? Math.random() * randomDelay : 0)));
}

function stopIfNoOriginalList() {
    if(!localStorage.getItem('originalTwitterFollowingList')) {
        alert('No original follower list found. Please save the original list first.');
        stopRunning = true;
    }
}
