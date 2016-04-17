/**
 * Created by Siarhei_Hamanovich in 2016.
 * EPAM Systems
 */

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Utils = function () {
	function Utils() {
		_classCallCheck(this, Utils);
	}

	_createClass(Utils, [{
		key: 'jsonp',
		value: function jsonp(url, callback) {
			var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random()),
			    script = void 0;

			window[callbackName] = function (data) {
				delete window[callbackName];
				document.body.removeChild(script);
				callback(data);
			};

			script = document.createElement('script');
			script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;

			document.body.appendChild(script);
		}
	}, {
		key: 'toCapitalize',
		value: function toCapitalize(str) {
			return str.length ? str[0].toUpperCase() + str.slice(1) : str;
		}
	}, {
		key: 'getRandomInt',
		value: function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}
	}]);

	return Utils;
}();

var utils = new Utils();
//
//Storage.prototype.setObject = function(key, value) {
//	this.setItem(key, JSON.stringify(value));
//}
//
//Storage.prototype.getObject = function(key) {
//	var value = this.getItem(key);
//	return value && JSON.parse(value);
//}

var AudioContext = function () {
	function AudioContext() {
		_classCallCheck(this, AudioContext);

		this.audio = null;
	}

	_createClass(AudioContext, [{
		key: 'setPlay',
		value: function setPlay(track) {
			if (this.audio !== null) {
				this.setStop();
			}

			this.audio = new Audio(track.previewUrl);
			this.audio.id = track.trackId;
			this.audio.title = track.artistName + ' — ' + track.trackName;
			this.audio.volume = iPlayer.volume;
			this.audio.loop = false;
			this.audio.autoplay = true;

			this.audio.play();

			this.audio.onloadedmetadata = this.loadedMetaData;
			this.audio.ontimeupdate = this.timeUpdate;
			this.audio.onended = this.onEnd;

			sessionStorage.setItem('currentId', this.audio.id);
		}
	}, {
		key: 'setStop',
		value: function setStop() {
			if (this.audio !== null) {
				this.audio.pause();
				this.audio.currentTime = 0;
			}
		}
	}, {
		key: 'onEnd',
		value: function onEnd(e) {
			if (this.autoplay) {
				iPlayer.api(null, 'next', sessionStorage.getItem('song'));
			}
		}
	}, {
		key: 'timeUpdate',
		value: function timeUpdate() {
			var timeline = document.querySelector('.timeline'),
			    progressBar = timeline.querySelector('.progress-bar'),
			    duration = this.duration,
			    currentTime = this.currentTime,
			    currentRate = currentTime * 100 / duration;

			if (currentRate > 100) {
				currentRate = 100;
			}

			timeline.classList.remove('hidden');
			progressBar.style.width = currentRate + '%';
		}
	}]);

	return AudioContext;
}();

var audioContext = new AudioContext();

var Favourite = function () {
	function Favourite() {
		_classCallCheck(this, Favourite);
	}

	_createClass(Favourite, [{
		key: 'addToFavourite',
		value: function addToFavourite() {
			var favWrap = document.querySelector('.favourites'),
			    favList = favWrap.querySelector('.fav-list'),
			    li = document.createElement('li'),
			    a = document.createElement('a'),
			    id = sessionStorage.getItem('currentId'),
			    likedIcon = document.querySelector('.active-track .liked');

			if (!favList.querySelector('[data-id="' + id + '"]')) {
				a.setAttribute('href', audioContext.audio.src);
				a.setAttribute('class', 'favLink');
				a.innerHTML = audioContext.audio.title;

				li.dataset.id = id;
				li.appendChild(a);
				favList.appendChild(li);

				likedIcon.classList.add('selected');

				sessionStorage.setItem('favId', (sessionStorage.getItem('favId') ? sessionStorage.getItem('favId') + ',' : '') + audioContext.audio.id);

				//console.log()
				sessionStorage.setObject('favObj', this.getSongById(id));
			}

			if (sessionStorage.getItem('favId')) {
				favWrap.classList.remove('hidden');
			}
		}
	}, {
		key: 'removeFromFavourite',
		value: function removeFromFavourite() {
			var favWrap = document.querySelector('.favourites'),
			    favList = favWrap.querySelector('.fav-list'),
			    id = sessionStorage.getItem('currentId'),
			    likedIcon = document.querySelector('[data-id="' + id + '"] .liked'),
			    ssfavidArray = sessionStorage.getItem('favId').split(','),
			    idIndex = ssfavidArray.indexOf(id);

			favList.removeChild(favList.querySelector('[data-id="' + id + '"]'));
			ssfavidArray.splice(idIndex, 1);

			likedIcon.classList.remove('selected');

			sessionStorage.setItem('favId', ssfavidArray.join());

			if (!sessionStorage.getItem('favId') || !sessionStorage.getItem('favId').length) {
				favWrap.classList.add('hidden');
			}
		}
	}, {
		key: 'updateFavourites',
		value: function updateFavourites(track) {
			var favWrap = document.querySelector('.favourites'),
			    favList = favWrap.querySelector('.fav-list'),
			    li = document.createElement('li'),
			    a = document.createElement('a');

			a.setAttribute('href', track.previewUrl);
			a.setAttribute('class', 'favLink');
			a.innerHTML = track.artistName + ' — ' + track.trackName;

			li.dataset.id = track.trackId;
			li.appendChild(a);
			favList.appendChild(li);

			this.updateFavouritesLikes(track);
		}
	}, {
		key: 'updateFavouritesLikes',
		value: function updateFavouritesLikes(track) {
			if (document.querySelector('[data-id="' + track.trackId + '"] .liked')) {
				document.querySelector('[data-id="' + track.trackId + '"] .liked').classList.add('selected');
			}
		}
	}, {
		key: 'highlightFavourite',
		value: function highlightFavourite(id) {
			[].forEach.call(document.querySelectorAll('.favourites [data-id]'), function (el) {
				el.classList.remove('active');
			});

			document.querySelector('[data-id="' + +id + '"]').classList.add('active');
		}
	}]);

	return Favourite;
}();

var fav = new Favourite();
/*
 * Voice Player class IPlayer
*/

var IPlayer = function () {
	function IPlayer(options) {
		_classCallCheck(this, IPlayer);

		if (window.webkitSpeechRecognition === 'undefined') {
			return;
		}

		this.options = options || {};
		this.patience = this.options.patience || 3;
		this.limit = this.options.limit || 50;
		this.volume = this.options.volume || 1;
		this.volumeWhenSpeak = this.options.volumeWhenSpeak || 0.1;
		this.loadingCopy = this.options.loading || 'Loading…';
		this.speechNotification = this.options.speechNotification || 'alert';

		this.langs = [['English', ['en-GB']], ['Pусский', ['ru-RU']]];

		this.commands = {
			play: ['play', 'find', 'search', 'найти'],
			next: ['next', 'дальше', 'вперед'],
			previous: ['previous', 'назад', 'предыдущий'],
			repeat: ['repeat', 'повторить'],
			loop: ['loop', 'зациклить'],
			autoplay: ['autoplay', 'автовоспроизведение'],
			stop: ['stop', 'стоп'],
			random: ['random', 'произвольно'],
			volume: ['volume', 'сделать'],
			mute: ['mute', 'беззвучный'],
			like: ['like', 'нравится', 'класс'],
			dislike: ['dislike', 'плохо', 'ерунда'],
			go: ['go', 'перейти']
		};

		this.songs = [];
		this.index = 0;
		this.recognition = new window.webkitSpeechRecognition();
		this.recognition.continuous = true;
		this.timeout = null;
		this.recognizing = false;

		this.utterance = new window.SpeechSynthesisUtterance();
		this.utterance.rate = 1;
		this.utterance.pitch = 1;
		this.utterance.volume = 1;

		this.loadingElement = document.querySelector('.loading');

		if (typeof this.init === 'function' && this.init !== 'undefined') {
			this.init();
		}
	}

	/*
 * Initialization iPlayer
 */


	_createClass(IPlayer, [{
		key: 'init',
		value: function init() {
			var self = this,
			    main = document.getElementById('main');

			function onStart() {
				console.log('onstart');
				self.recognizing = true;

				restartTimer();

				if (audioContext.audio !== null) {
					audioContext.audio.volume = self.volumeWhenSpeak;
				}
			}

			function onEnd() {
				self.recognizing = false;
				clearTimeout(self.timeout);
			}

			function onError(e) {
				console.log(e.error);
			}

			function onResult() {
				var transcript = event.results[0][0].transcript,
				    action = transcript.split(" ").splice(0, 1).join(' ').toLowerCase(),
				    song = transcript.split(" ").splice(1).join(' ');

				restartTimer();

				resultAction(action, song);
			}

			function resultAction(action, song) {
				if (self.commands.play.indexOf(action) !== -1) {
					self.refresh();
					self.loader('remove');

					utils.jsonp('https://itunes.apple.com/search?term=' + song + '&limit=' + self.options.limit, function (data) {
						self.api(data, action, song);
					});
				} else {
					self.api(null, action, song);
				}
			}

			function restartTimer() {
				clearTimeout(self.timeout);

				self.timeout = setTimeout(function () {
					self.recognition.stop();
				}, self.patience * 1000);
			}

			function eventListener(e) {
				var el = e.target,
				    parent = el.parentElement,
				    indx = void 0,
				    id = void 0;

				if (el.getAttribute('id') === 'playerBtn') {
					e.preventDefault();

					if (self.recognizing) {
						self.recognition.stop();

						return;
					}

					self.recognition.start();
				}

				if (parent.classList.contains('trackLink')) {
					e.preventDefault();

					indx = +el.closest('[data-index]').dataset.index;

					audioContext.setPlay(self.songs[indx]);

					self.index = indx;
					indx = indx + 1;

					sessionStorage.setItem('index', self.index);

					self.highlight(+sessionStorage.getItem('index'));
				}

				if (el.classList.contains('favLink')) {
					e.preventDefault();

					id = +el.closest('[data-id]').dataset.id;

					fav.highlightFavourite(id);

					utils.jsonp('https://itunes.apple.com/lookup?id=' + id, function (data) {
						audioContext.setPlay(data.results[0]);

						if (document.querySelector('.tune-wrap [data-id="' + data.results[0].trackId + '"]')) {
							sessionStorage.setItem('index', document.querySelector('.tune-wrap [data-id="' + data.results[0].trackId + '"]').closest('[data-index]').dataset.index);

							self.highlight(+sessionStorage.getItem('index'));
						}
					});
				}
			}

			this.language();
			this.sessions();
			this.favourites();

			this.recognition.onstart = onStart;
			this.recognition.onend = onEnd;
			this.recognition.onerror = onError;
			this.recognition.onresult = onResult;

			main.onclick = eventListener;
		}

		/*
  * Main Voice Player API
  */

	}, {
		key: 'api',
		value: function api(data, action, song) {
			var tuneWrap = document.querySelector('.tune-wrap'),
			    query = document.getElementById('search-query'),
			    total = document.getElementById('search-total'),
			    ssaction = sessionStorage.getItem('action') === 'stop' ? 'stop' : 'play',
			    ssfavidList = sessionStorage.getItem('favId'),
			    results = void 0,
			    item = void 0,
			    activeElement = void 0,
			    artist = void 0,
			    collection = void 0;

			for (var i in this.commands) {
				if (this.commands.hasOwnProperty(i)) {
					if (this.commands[i].indexOf(action) !== -1) {
						action = i;
					}
				}
			}

			sessionStorage.setItem('action', action);

			console.log(action);

			// Voice API
			switch (action) {
				case 'play':

					results = data.results;

					if (_typeof(results[0]) !== 'object' || results[0] === 'undefined') {
						this.speechAlert('Oops, for your searching nothing found! Try again.');
						return;
					}

					while (tuneWrap.firstChild) {
						tuneWrap.removeChild(tuneWrap.firstChild);
					}

					this.loader('add');

					for (item in results) {
						if (results[item] !== null && results.hasOwnProperty(item)) {
							this.songs.push(results[item]);
							this.thumbnail(results[item], item);
						}
					}

					query.parentElement.classList.remove('hidden');
					query.innerHTML = utils.toCapitalize(song);
					total.innerHTML = data.resultCount;

					sessionStorage.setItem('song', song);

					if (ssaction === 'play') {
						audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);
					}

					if (ssfavidList) {
						utils.jsonp('https://itunes.apple.com/lookup?id=' + ssfavidList, function (data) {
							for (var _i = 0; _i < data.results.length; _i = _i + 1) {
								fav.updateFavouritesLikes(data.results[_i]);
							}
						});
					}

					break;

				case 'repeat':

					audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

					break;

				case 'autoplay':

					audioContext.audio.autoplay = audioContext.audio.autoplay === true ? false : true;
					audioContext.audio.volume = this.volume;

					break;

				case 'loop':

					audioContext.audio.loop = audioContext.audio.loop === true ? false : true;
					audioContext.audio.volume = this.volume;

					break;

				case 'next':

					if (+sessionStorage.getItem('index') > this.songs.length - 2) {
						sessionStorage.setItem('index', -1);
					}

					sessionStorage.setItem('index', +sessionStorage.getItem('index') + 1);
					audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

					break;

				case 'random':
					var randTrack = utils.getRandomInt(0, this.limit);

					sessionStorage.setItem('index', +randTrack);
					audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

				case 'previous':

					if (+sessionStorage.getItem('index') === 0) {
						+sessionStorage.setItem('index', this.songs.length);
					}

					+sessionStorage.setItem('index', +sessionStorage.getItem('index') - 1);
					audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

					break;

				case 'stop':

					audioContext.setStop();

					break;

				case 'volume':

					if (song === 'up' || song === 'громче') {
						if (this.volume < 1) {
							this.volume += 0.2;
						}
					} else if (song === 'down' || song === 'тише') {
						if (this.volume > 0) {
							this.volume -= 0.2;
						}
					}

					audioContext.audio.volume = this.volume;

					break;

				case 'mute':

					audioContext.audio.muted = audioContext.audio.muted === true ? false : true;

					break;

				case 'like':

					fav.addToFavourite();

					audioContext.audio.volume = this.volume;

					break;

				case 'dislike':

					fav.removeFromFavourite();

					audioContext.audio.volume = this.volume;

					break;

				case 'go':
					activeElement = document.querySelector('.active-track');
					artist = activeElement.querySelector('.trackArtist').getAttribute('href');
					collection = activeElement.querySelector('.trackCollection').getAttribute('href');

					if (song === 'to artist' || song === 'автор') {
						window.open(artist, '_blank');
					} else if (song === 'to collection' || song === 'коллекция') {
						window.open(collection, '_blank');
					}

					audioContext.audio.volume = this.volume;

					break;

				default:
					this.loader('add');

					this.speechAlert('Unknown command. Try again.');

					break;
			}

			this.highlight(+sessionStorage.getItem('index'));
		}
	}, {
		key: 'highlight',
		value: function highlight(indx) {
			[].forEach.call(document.querySelectorAll('[data-index]'), function (el) {
				el.classList.remove('active-track');
			});

			document.querySelector('[data-index="' + +indx + '"]').classList.add('active-track');
		}
	}, {
		key: 'getSongById',
		value: function getSongById(id) {
			for (var track in this.songs) {
				if (!this.songs.hasOwnProperty(track)) {
					return;
				}

				if (this.songs[track].trackId === +id) {
					return this.songs[track];
				}
			}
		}
	}, {
		key: 'language',
		value: function language() {
			var _this = this;

			for (var i = 0; i < this.langs.length; i = i + 1) {
				selectLanguage.options[i] = new Option(this.langs[i][0], this.langs[i][1]);
			}

			selectLanguage.onchange = function () {
				_this.recognition.lang = selectLanguage.value;
			};

			this.recognition.lang = selectLanguage.value;
		}
	}, {
		key: 'refresh',
		value: function refresh() {
			this.songs = [];
			this.index = 0;
			sessionStorage.setItem('index', 0);
		}
	}, {
		key: 'loader',
		value: function loader(fn) {
			this.loadingElement.innerHTML = this.loadingCopy;

			if (fn === 'add') {
				this.loadingElement.classList.add('hidden');
			} else if (fn === 'remove') {
				this.loadingElement.classList.remove('hidden');
			}
		}
	}, {
		key: 'sessions',
		value: function sessions() {
			var _this2 = this;

			var sssong = sessionStorage.getItem('song'),
			    ssfavidList = sessionStorage.getItem('favId');

			if (!sssong) {
				return;
			}

			this.loader('remove');

			utils.jsonp('https://itunes.apple.com/search?term=' + sssong + '&limit=' + this.options.limit, function (data) {
				_this2.api(data, 'play', sssong);

				if (ssfavidList) {
					utils.jsonp('https://itunes.apple.com/lookup?id=' + ssfavidList, function (data) {
						for (var i = 0; i < data.results.length; i = i + 1) {
							fav.updateFavourites(data.results[i]);
						}
					});
				}
			});
		}
	}, {
		key: 'speechAlert',
		value: function speechAlert(msg) {
			var _this3 = this;

			if (this.speechNotification === 'speech') {

				this.utterance.text = msg;
				this.utterance.onend = function (e) {
					if (audioContext.audio !== null) {
						audioContext.audio.volume = _this3.volume;
					}
				};

				speechSynthesis.speak(this.utterance);
			} else if (this.speechNotification === 'alert') {
				alert(msg);

				if (audioContext.audio !== null) {
					audioContext.audio.volume = this.volume;
				}
			}
		}

		/*
  * Creation Thumbnail card layout via <template>
  */

	}, {
		key: 'thumbnail',
		value: function thumbnail(data, i) {
			var thumbnailContent = document.getElementById('thumbnail').content,
			    tuneWrap = document.querySelector('.tune-wrap'),
			    thumbnail = thumbnailContent.querySelector('.thumbnail'),
			    caption = thumbnail.querySelector('.caption'),
			    trackImg = caption.querySelector('.trackImg'),
			    trackLink = caption.querySelector('.trackLink'),
			    trackName = caption.querySelector('h5'),
			    trackGenre = caption.querySelector('.trackGenre'),
			    trackCountry = caption.querySelector('.trackCountry'),
			    trackArtist = caption.querySelector('.trackArtist'),
			    trackCollection = caption.querySelector('.trackCollection');

			thumbnail.dataset.id = data.trackId;
			trackImg.src = data.artworkUrl100;
			trackImg.alt = data.collectionCensoredName || '';
			trackName.textContent = data.artistName + ' — ' + data.trackName;
			trackLink.href = data.previewUrl;
			trackGenre.textContent = data.primaryGenreName;
			trackCountry.textContent = data.country;
			trackArtist.href = data.artistViewUrl;
			trackCollection.href = data.collectionViewUrl;

			thumbnailContent.children[0].setAttribute('data-index', i);

			tuneWrap.appendChild(document.importNode(thumbnailContent, true));
		}

		/*
   * Creation Favourite list layout via <template>
   */

	}, {
		key: 'favourites',
		value: function favourites(data, i) {
			var favContent = document.getElementById('favourites').content,
			    favWrap = document.querySelector('.favourites');

			favWrap.appendChild(document.importNode(favContent, true));

			if (!sessionStorage.getItem('favId')) {
				favWrap.classList.add('hidden');
			} else {
				favWrap.classList.remove('hidden');
			}
		}
	}]);

	return IPlayer;
}();