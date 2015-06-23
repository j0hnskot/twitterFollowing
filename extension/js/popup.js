document.addEventListener('DOMContentLoaded', function () {
    var checkPageButton = document.getElementById('checkPage');
    checkPageButton.addEventListener('click', function () {

        chrome.tabs.getSelected(null, function (tab) {
            console.log('wtf');
            console.log(chrome.storage);
            console.log(chrome.storage.local.get('wtf' ,function(q){
            
               console.log(q)
            }))
       

        });
    }, false);
}, false);