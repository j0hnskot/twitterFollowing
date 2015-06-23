Object.size = function (obj) {
		var size = 0,
				key;
		for (key in obj) {
				if (obj.hasOwnProperty(key)) size++;
		}
		return size;
};

var FOLLOW_DELAY = 500,
		STOP = false,
		messages = {
				"errors": '',
				"warnings": '',
				"info": '',
				"clear": function(){

						messages.errors = '';
						messages.warnings = '';
						messages.info = '';

					}
		},
		i = 0,
		lastWindowHeight = 0,
		scrollTries = 30,
		names = {},
		oldNames = {},
		oldFollowers = {},
		whiteList = ['21861033','16150760','8520','11417762','2389664502','35761106', '998182430', '192969516', '453510020', '16004473', '1114232789'];

if (localStorage.getItem('twitterFollowers') === null) {
		localStorage.setItem('twitterFollowers', JSON.stringify(names));
}

oldNames = JSON.parse(localStorage.getItem('twitterFollowers'));

function follow(force, mute) {

		names = {};
		i = 0;
		STOP = false;
		hideFollowersByButtonColor();
		hideInactive();
		hideLocked();
		var idAttrName = 'data-user-id';


		$('div.account').each(function (index) {
				names[index] = $(this).attr('data-user-id');
		});

		if(Object.size(names)===0){
			$('div[data-test-selector="ProfileTimelineUser"]').each(function (index) {
					names[index] = $(this).children('div.js-stream-item').attr('data-item-id');
			});
			idAttrName = 'data-item-id';
			addMessage('TEST2' ,'error');


		}


		addMessage(JSON.stringify(names) ,'error')
		addMessage('TEST' ,'error')

		if (localStorage.getItem('twitterFollowers') === null) {
				localStorage.setItem('twitterFollowers', JSON.stringify(names));
		} else {

				var alreadyFollowed = true;

				for (var name in names) {
						alreadyFollowed = false;

						for (var oldName in oldNames) {
								if (!oldNames.hasOwnProperty(oldName) || alreadyFollowed) continue;
								if (oldName === names[name]) {
										alreadyFollowed = true;
										continue;
								}

						}

						if (!alreadyFollowed || (typeof force !== 'undefined' && force === true)) {

								addMessage("Will follow: " + names[name]);
								var q = $("div[" +idAttrName+"='" + names[name] + "']");

								window.setTimeout(followCurrent.bind(this, names[name]), FOLLOW_DELAY * i + 1);

								i += 1;

						} else {
								addMessage('already followed ' + names[name], 'warning');
						}

				}

		}

		function followCurrent (name) {
					if(STOP) return;
						var q = $("div["+idAttrName+"='" + name + "']");
						$(q).find('button[class~=follow-button]').trigger('click');

						saveFollower(name);
						if (typeof mute !== 'undefined' && mute === true) muteFollower(q);

				}

}

function muteVisible() {

		var i = 0;
		$('div.account').each(function (index) {

				window.setTimeout(function (name) {
								muteFollower($(this));
						}
						.bind(this), FOLLOW_DELAY * i + 1);
				i++;
		});

}

function muteFollower(followerDiv) {

		var follower = $(followerDiv).find('div.user-actions').find('div.dropdown-menu').find('button:contains("Mute")').trigger('click');

}

function saveFollower(followerID, resetDate) {

		oldNames[followerID] = {
				"date": (resetDate)? 0 : Date.now()
		};
		localStorage.setItem('twitterFollowers', JSON.stringify(oldNames));
		addMessage('Saved ' + followerID );

}

function removeFromStorage(followerID) {

		var names = JSON.parse(localStorage.getItem('twitterFollowers'));
		if (typeof names[followerID] === 'undefined') {
				addMessage(followerID + ' was not found', 'error');
				return;
		}

		names[followerID] = undefined;
		addMessage(names[followerID]);
		localStorage.setItem('twitterFollowers', JSON.stringify(names));
		addMessage(followerID + ' is deleted from localStorage');

}
//Adds time passed since following to each account div
function filterByTime(days) {

	var dayInMS = 86400000;
	days = days || 1;
	var i = 0;
	addMessage('Starting size : ' + Object.size(oldNames));

	for (var id in oldNames) {

			if(Date.now() - oldNames[id].date < days * dayInMS){

				window.setTimeout(removeCurrent.bind(this,id),10 * i + 1);
				i+=1;
			}

	}

	function removeCurrent (userId) {

		$("div[data-test-selector=ProfileTimelineUser]").has("div[data-user-id='" + userId + "']").remove();

		addMessage(userId + ' Is removed');

	}

	addMessage('Ending size: ' + i);

}

function findUnfollowers(filterByTime, days) {

		var dayInMS = 86400000;
		days = days || 1;
		var i = 0;
		var currentName = '';
		var unfollow = $('div[data-test-selector="ProfileTimelineUser"]:not(:has(span.FollowStatus))');
		unfollow.each(function (q) {

				window.setTimeout(function () {

						currentName = $(this).find('div[data-user-id]').attr('data-user-id');
						addMessage(currentName,'error');

						if(typeof oldNames[currentName] === 'undefined'){ saveFollower(currentName); return;}

						if(filterByTime === true && (Date.now() - oldNames[currentName].date < days * dayInMS) ){
							addMessage('wtf ' + currentName,'error');
							return;
						}

						if (whiteList.indexOf(currentName) !== -1) {
								addMessage('The user ' + currentName + ' is whitelisted', 'warning');
								return;
						}

						addMessage('unfollowed ' + currentName);
						$(this).find('button.follow-button').trigger('click');
						saveFollower(currentName, true);
						// $(this).remove();

				}.bind(this), FOLLOW_DELAY * i + 1);
				i += 1;


		});

}

function hideFollowers() {


		var i = 0;
		var currentName = '';
		var followers = $('div[data-test-selector="ProfileTimelineUser"]:has(span.FollowStatus)');
		followers.each(function (q) {

				window.setTimeout(function () {
						currentName = $(this).find('div[data-screen-name]').attr('data-screen-name');
						if (whiteList.indexOf(currentName) !== -1) {
								return;
						}
						$(this).remove();

				}.bind(this), 100 * (i + 1));
				i += 1;

		});

}

function hideFollowersByButtonColor() {

		var q = [];
		var a = $('li[data-item-type*="user"]');

		if(a.length === 0){ // This works when following through another person's followers
			a = $('div[data-test-selector="ProfileTimelineUser"');

		}

		a = a.has('span.following-text').filter(function () {
				var button = $(this).find('span.following-text');
				var color = $(button).css("border-color").toLowerCase();
				q.push(color);
				return color === "rgb(255, 255, 255)";
		});

		a.each(function () {
				$(this).remove();
		});

}
//checks if the user has the default photo
function hideInactive() {

		var a = $('li[data-item-type*="user"]').has('img[src*="abs.twimg.com/sticky/default_profile_images/"]');
		a.each(function () {
				$(this).remove();
		});

}

function hideLocked() {

		var a = $('li[data-item-type*="user"]')

		if(a.length === 0){ // This works when following through another person's followers
			a = $('div[data-test-selector="ProfileTimelineUser"');

		}

		a = a.has('span.Icon--protected');
		a.each(function () {
				$(this).remove();
		});

}

function showOnlyVerified() {
		var nonVerified = $('div.js-stream-item').not(":has('span.Icon--verified')");
		$(nonVerified).each(function () {
				this.remove();
		});
}

function scrollToBottom() {

		if (scrollTries === 0) {
				scrollTries = 30;
				return;
		}
		if (document.body.scrollHeight === lastWindowHeight) {
				scrollTries--;
				window.setTimeout(scrollToBottom, 1000);
				return;
		}
		lastWindowHeight = document.body.scrollHeight;
		window.scrollTo(0, document.body.scrollHeight);
		messages.errors += lastWindowHeight + '\n';
		scrollTries = 30;
		window.setTimeout(scrollToBottom, 600);


}

function addMessage(message, reason) {

		if (typeof reason === 'undefined') {
				messages.info += "\n" + message + "   (" + new Date() + ")\n";
				return;
		}
		if (reason === 'error') {
				messages.errors += "\n" + message + "   (" + new Date() + ")\n";
				return;
		}

		if (reason === 'warning') {
				messages.warnings += "\n" + message + "   (" + new Date() + ")\n";
				return;
		}



}

function createWindow(){
$("<style type='text/css'>#twitterFollowersWindow{color:#f00;	font-weight:bold;	font-size: 30px;	width:300px;	height:600px;	background: grey;	position: fixed;	top:0; z-index:99999} </style>").appendTo('head');

$('<div id="twitterFollowersWindow"><button follow-app-btn="follow" ">Follow</button><button follow-app-btn="findUnfollowers">UnFollow</button><button follow-app-btn="follow">Follow</button></div>').appendTo('body');

$('button[follow-app-btn=follow]').on('click',function(){follow()})


}
