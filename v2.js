const followDelay = 500;
const debug = true;

start();

async function start() {
  while (await follow());
}

async function follow() {
  await removeAlreadyFollowing();
  await removeAlreadyFollowed();

  const toFollow = document.querySelectorAll('div [data-testid*="UserCell"]');

  if (toFollow.length === 0) {
    return;
  }

  for (const personDiv of toFollow) {
    await sleep(followDelay);
    if (!debug) personDiv.querySelector('div [aria-label*="Follow "]').click();

    const unfollowPopupOpen = document.querySelector(
      "[data-testid='confirmationSheetConfirm']"
    );
    if (unfollowPopupOpen) unfollowPopupOpen.click();

    personDiv.remove();
  }

  return true;
}

async function removeAlreadyFollowing() {

  const xPathResult = document.evaluate(
    "//span[contains(., 'Follows you')]",
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
    e.closest('div [data-testid*="UserCell"]').remove();
  });
  
}

async function removeAlreadyFollowed() {

  let alreadyFollowed = document.querySelectorAll(
    'div [aria-label*="Following @"]'
  );
  while (
    (alreadyFollowed = document.querySelectorAll(
      'div [aria-label*="Following @"]'
    )) &&
    alreadyFollowed.length
  ) {
    for (const personDiv of alreadyFollowed) {
      personDiv.closest('div [data-testid*="UserCell"]').remove();
    }

    await sleep(1000);
  }

}

async function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
