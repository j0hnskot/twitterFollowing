const followDelay = 500;
const delayForRefresh = 1500;
const debug = true;

const userCellQuery = 'div [data-testid*="UserCell"]';
const followerQuery = "//span[contains(., 'Follows you')]";
const unfollowPopupQuery = "[data-testid='confirmationSheetConfirm']";
const followButtonQuery = 'div [aria-label*="Follow "]';
const alreadyFollowingQuery = 'div [aria-label*="Following @"]';
const originalFollowingListQuery = 'div[data-testid*="-unfollow"]';
const defaultTwitterImage = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png';

createControlPanel();

function createControlPanel(){
    
    const panelDiv = document.createElement('div');
    panelDiv.setAttribute('style', 'position: fixed; bottom: 0; left: 0; width: 100%; height: 50px; background-color: #f5f5f5;');
    document.body.appendChild(panelDiv);
 
    const saveFollowingBtn = document.createElement("button"); 
    saveFollowingBtn.innerText = "Save Original Following List";
    saveFollowingBtn.onclick = saveOriginalFollowingList;
    saveFollowingBtn.setAttribute('style', 'z-index: 9999; background-color: #fff; border: 1px solid #ccc; padding: 10px;');
    panelDiv.appendChild(saveFollowingBtn);

    const follow = document.createElement("button"); 
    follow.innerText = "Start Following";
    follow.onclick = start;
    follow.setAttribute('style', 'position: fixed; bottom: 0; z-index: 9999; background-color: #fff; border: 1px solid #ccc; padding: 10px;');
    panelDiv.appendChild(follow);
    
}
    

async function start() {
  while (await follow());
}

async function saveOriginalFollowingList() {
   
    const originalFollowingList = [];
   
    let originalFollowingListDiv = []
    
    while((originalFollowingListDiv = document.querySelectorAll(originalFollowingListQuery)) && originalFollowingListDiv.length){
 
        originalFollowingListDiv.forEach((e) => {
            originalFollowingList.push(e.getAttribute('data-testid').split('-')[0]);
            e.closest(userCellQuery).remove();
        }); 

        await sleep(delayForRefresh);
    }

    const valueToStore =  JSON.stringify(originalFollowingList)

    if (localStorage.getItem('twitterFollowers') === null) {
        localStorage.setItem('twitterFollowers', valueToStore); 
    }

    const c = document.createElement("a");
    c.download = valueToStore;
    const t = new Blob([valueToStore], {
        type: "text/plain"
    });
    c.href = window.URL.createObjectURL(t);
    c.click();
    c.remove();

}

async function follow() {
  await removeAlreadyFollowing();
  await removeAlreadyFollowed();
  removeInactive();
  
  const toFollow = document.querySelectorAll(userCellQuery);

  if (toFollow.length === 0) {
    return;
  }

  for (const personDiv of toFollow) {
    await sleep(followDelay);
    if (!debug) personDiv.querySelector(followButtonQuery).click();

    const unfollowPopupOpen = document.querySelector(
      unfollowPopupQuery
    );
    if (unfollowPopupOpen) unfollowPopupOpen.click();

    personDiv.remove();
  }

  return true;
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

  alreadyFollowing.forEach((e) => {
    e.closest(userCellQuery).remove();
  });

}

async function removeAlreadyFollowed() {

  let alreadyFollowed = document.querySelectorAll(
    alreadyFollowingQuery
  );
  while (
    (alreadyFollowed = document.querySelectorAll(
        alreadyFollowingQuery
    )) &&
    alreadyFollowed.length
  ) {
    for (const personDiv of alreadyFollowed) {
      personDiv.closest(userCellQuery).remove();
    }

    await sleep(delayForRefresh);
  }

}

function removeInactive() {

    const inactive = document.querySelectorAll('img[src*="' + defaultTwitterImage + '"]');


    inactive.forEach((e) => {
        e.closest(userCellQuery).remove();
      });
}

async function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
