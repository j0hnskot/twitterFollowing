const sleep = (ms) => {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
};

const followDelay = 500
const debug = true;

// const toFollow = document.querySelectorAll('div [aria-label*="Follow"]')
// document.querySelectorAll('div [aria-label*="Follow"]')
// Could also do it with XPath - seems more efficient
const xPathResult = document.evaluate("//span[contains(., 'Follows you')]", document, null, XPathResult.ANY_TYPE, null)

const alreadyFollowing = [];
let node = xPathResult.iterateNext();
while (node) {
    alreadyFollowing.push(node);
  node = xPathResult.iterateNext();
}

alreadyFollowing.forEach(e =>{
    e.closest('div [data-testid*="UserCell"]').remove();
})

const toFollow = document.querySelectorAll('div [data-testid*="UserCell"]')

for(const personDiv of toFollow) {
    console.log(personDiv)

    await sleep(followDelay);
    if (!debug) personDiv.querySelector('div [aria-label*="Follow "]').click();
    const unfollowOpen = document.querySelector("[data-testid='confirmationSheetConfirm']")
    if(unfollowOpen) unfollowOpen.click();
}

 

function removeAlreadyFollowed() {
    let alreadyFollowed = document.querySelectorAll('div [aria-label*="Following @"]');
    while((alreadyFollowed = document.querySelectorAll('div [aria-label*="Following @"]')) && alreadyFollowed.length) {
        for(const personDiv of alreadyFollowed) {
            personDiv.closest('div [data-testid*="UserCell"]').remove();
        }

        await sleep(1000);

    }

    console.log('done')
}

