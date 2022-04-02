const followDelay = 500;
const debug = true;

const userCellQuery = 'div [data-testid*="UserCell"]';
const followerQuery = "//span[contains(., 'Follows you')]";
const unfollowPopupQuery = "[data-testid='confirmationSheetConfirm']";
const followButtonQuery = 'div [aria-label*="Follow "]';
const alreadyFollowingQuery = 'div [aria-label*="Following @"]';
const defaultTwitterImage = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png';

start();

async function start() {
  while (await follow());
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

    await sleep(1000);
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
