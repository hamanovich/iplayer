/*
 * Voice Player class IPlayer
*/

class IPlayer {
	constructor({
			patience = 3,
			limit = 150,
			volume = 1,
			volumeWhenSpeak = 0.1,
			loading = 'Loading…',
			speechNotification = 'alert'} = {}){

		if (window.webkitSpeechRecognition === 'undefined') {
			return;
		}

		this.patience = patience;
		this.limit = limit;
		this.volume = volume || 1;
		this.volumeWhenSpeak = volumeWhenSpeak;
		this.loadingCopy = loading;
		this.speechNotification = speechNotification;

		this.langs = [
			['English', ['en-GB']],
			['Pусский', ['ru-RU']]
		];

		this.commands = {
			play:       ['play', 'find', 'search', 'найти'],
			next:       ['next', 'forward', 'дальше', 'вперед'],
			previous:   ['previous', 'back', 'назад', 'предыдущий'],
			repeat:     ['repeat', 'again', 'повторить'],
			loop:       ['loop', 'зациклить'],
			autoplay:   ['autoplay', 'auto', 'автовоспроизведение'],
			stop:       ['stop', 'стоп'],
			random:     ['random', 'произвольно'],
			volume:     ['volume', 'сделать'],
			mute:       ['mute', 'беззвучный'],
			like:       ['like', 'cool', 'нравится', 'класс'],
			dislike:    ['dislike', 'bad', 'плохо', 'ерунда'],
			go:         ['go', 'перейти'],
			reset:      ['reset', 'clear', 'clean', 'сброс'],
			change:     ['change', 'изменить', 'сменить']
		};

		this.suffixs = [];
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

		this.audioContext = new AudioContext();
		this.fav = new Favourite();

		if (typeof this.init === 'function' && this.init !== 'undefined') {
			this.init();
		}
	}

	/*
	* Initialization iPlayer
	*/
	init() {
		let self = this,
			main = document.getElementById('main');

		function onStart() {
			self.recognizing = true;

			restartTimer();

			if (self.audioContext.audio !== null) {
				self.audioContext.audio.volume = self.volumeWhenSpeak;
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
			let transcript = event.results[0][0].transcript,
				action = transcript.split(" ").splice(0, 1).join(' ').toLowerCase(),
				suffix = transcript.split(" ").splice(1).join(' ');

			restartTimer();

			resultAction(action, suffix);
		}

		function resultAction(action, suffix) {
			if (self.commands.play.includes(action)){
				self.refresh();
				self.loader('remove');

				utils.jsonp('https://itunes.apple.com/search?term=' + suffix + '&limit=' + self.limit, (data) => {
					self.api(action, data, suffix);
				});

			} else {
				self.api(action, null, suffix);
			}
		}

		function restartTimer() {
			clearTimeout(self.timeout);

			self.timeout = setTimeout(() => {
				self.recognition.stop();
			}, self.patience * 1000);
		}

		function eventListener(e) {
			let el = e.target,
				parent = el.parentElement,
				indx,
				id;

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

				self.audioContext.setPlay(self.suffixs[indx]);

				self.index = indx;

				sessionStorage.setItem('index', self.index);
				sessionStorage.setItem('type', 'main');

				self.constructor.highlight(+sessionStorage.getItem('index'));
				self.fav.highlightFavourite(sessionStorage.getItem('currentId'));
			}

			if (el.classList.contains('favLink')){
				e.preventDefault();

				id = +el.closest('[data-id]').dataset.id;

				sessionStorage.setItem('type', 'favourite');

				utils.jsonp('https://itunes.apple.com/lookup?id=' + id, (data) => {
					self.audioContext.setPlay(data.results[0]);

					if (document.querySelector('.tune-wrap [data-id="'+ data.results[0].trackId + '"]')) {
						sessionStorage
						.setItem('index', document.querySelector('.tune-wrap [data-id="' + data.results[0].trackId + '"]')
						.closest('[data-index]').dataset.index);
					}

					self.constructor.highlight(+sessionStorage.getItem('index'));
					self.fav.highlightFavourite(id);
				});
			}
		}

		this.language();
		this.sessions();
		this.fav.favourites();

		this.recognition.onstart = onStart;
		this.recognition.onend = onEnd;
		this.recognition.onerror = onError;
		this.recognition.onresult = onResult;

		main.onclick = eventListener;
	}

	/*
	* Main Voice Player API
	*/

	api(action, data, suffix) {
		let tuneWrap = document.querySelector('.tune-wrap'),
			favWrap = document.querySelector('.favourites'),
			favList = favWrap.querySelector('.fav-list'),
			query = document.getElementById('search-query'),
			total = document.getElementById('search-total'),
			ssaction = (sessionStorage.getItem('action') === 'stop') ? 'stop' : 'play',
			results,
			item,
			activeElement,
			artist,
			collection;

		for (let i in this.commands) {
			if (this.commands.hasOwnProperty(i)) {
				if (this.commands[i].includes(action)) {
					action = i;
					sessionStorage.setItem('action', action);
				}
			}
		}

		console.info(JSON.stringify(sessionStorage));

		// Voice API
		switch (action) {
			case 'play':

				results = data.results;

				if (typeof results[0] !== 'object' || results[0] === 'undefined') {
					this.speechAlert('Oops, for your searching nothing found! Try again.');
					return;
				}

				while (tuneWrap.firstChild) {
					tuneWrap.removeChild(tuneWrap.firstChild);
				}

				while (favList.firstChild) {
					favList.removeChild(favList.firstChild);
				}

				this.loader('add');

				for (item in results) {
					if (results[item] !== null && results.hasOwnProperty(item)){
						this.suffixs.push(results[item]);
						this.constructor.thumbnail(results[item], item);
					}
				}

				query.parentElement.classList.remove('hidden');
				query.innerHTML = utils.toCapitalize(suffix);
				total.innerHTML = data.resultCount;

				sessionStorage.setItem('suffix', suffix);

				if (sessionStorage.getItem('type') !== 'favourite'){
					if (ssaction === 'play') {
						this.audioContext.setPlay(this.suffixs[+sessionStorage.getItem('index')]);
						sessionStorage.setItem('action', 'play');
					}
				}

				if (sessionStorage.getItem('favId')){
					utils.jsonp('https://itunes.apple.com/lookup?id=' + sessionStorage.getItem('favId'), (data) => {
						for (let i = 0; i < data.results.length; i = i + 1){
							this.fav.updateFavourites(data.results[i]);
							this.fav.updateFavouritesLikes(data.results[i]);
						}

						this.fav.highlightFavourite(sessionStorage.getItem('currentId'));

						if (sessionStorage.getItem('type') === 'favourite') {
							this.fav.favApi('play');
						}
					});
				}

				break;

			case 'repeat':

				this.audioContext.setPlay(this.suffixs[+sessionStorage.getItem('index')]);

				break;

			case 'autoplay':

				this.audioContext.audio.autoplay = (this.audioContext.audio.autoplay !== true);
				this.audioContext.audio.volume = this.volume;

				break;

			case 'loop':

				this.audioContext.audio.loop = (this.audioContext.audio.loop !== true);
				this.audioContext.audio.volume = this.volume;

				break;

			case 'next':

				if(sessionStorage.getItem('type') === 'favourite') {

					this.fav.favApi('next');

				} else {

					if (+sessionStorage.getItem('index') > this.suffixs.length - 2){
						sessionStorage.setItem('index', -1);
					}

					sessionStorage.setItem('index', +sessionStorage.getItem('index') + 1);
					this.audioContext.setPlay(this.suffixs[+sessionStorage.getItem('index')]);

					this.fav.highlightFavourite(sessionStorage.getItem('currentId'));

				}

				break;

			case 'previous':

				if(sessionStorage.getItem('type') === 'favourite') {

					this.fav.favApi('prev');

				} else {

					if (+sessionStorage.getItem('index') === 0) {
						+sessionStorage.setItem('index', this.suffixs.length);
					}

					+sessionStorage.setItem('index', +sessionStorage.getItem('index') - 1);
					this.audioContext.setPlay(this.suffixs[+sessionStorage.getItem('index')]);

					this.fav.highlightFavourite(sessionStorage.getItem('currentId'));
				}

				break;

			case 'random':
				let randTrack = utils.getRandomInt(0, this.limit);

				sessionStorage.setItem('index', +randTrack);
				this.audioContext.setPlay(this.suffixs[+sessionStorage.getItem('index')]);

				break;

			case 'stop':

				this.audioContext.setStop();

				break;

			case 'volume':

				if (suffix === 'up' || suffix === 'громче'){
					if (this.volume < 1) {
						this.volume += 0.2;
					}
				} else if (suffix === 'down' || suffix === 'тише'){
					if (this.volume > 0) {
						this.volume -= 0.2;
					}
				}

				this.audioContext.audio.volume = this.volume;

				break;

			case 'mute':

				this.audioContext.audio.muted = (this.audioContext.audio.muted !== true);

				break;

			case 'like':

				this.fav.addToFavourite();

				this.audioContext.audio.volume = this.volume;

				break;

			case 'dislike':

				this.fav.removeFromFavourite();

				this.audioContext.audio.volume = this.volume;

				break;

			case 'go':
				activeElement = document.querySelector('.active-track');
				artist = activeElement.querySelector('.trackArtist').getAttribute('href');
				collection = activeElement.querySelector('.trackCollection').getAttribute('href');

				if (suffix === 'to artist' || suffix === 'автор'){
					window.open(artist, '_blank');
				} else if (suffix === 'to collection' || suffix === 'коллекция'){
					window.open(collection, '_blank');
				}

				this.audioContext.audio.volume = this.volume;

				break;

			case 'reset':
				sessionStorage.clear();
				this.audioContext.setStop();

				while (tuneWrap.firstChild) {
					tuneWrap.removeChild(tuneWrap.firstChild);
				}

				while (favList.firstChild) {
					favList.removeChild(favList.firstChild);
				}

				query.parentElement.classList.add('hidden');
				favWrap.classList.add('hidden');

				return;

			case 'change':
				if (sessionStorage.getItem('type') === 'main') {

					sessionStorage.setItem('type', 'favourite');
					this.fav.favApi('play');

				} else {
					sessionStorage.setItem('type', 'main');
					this.audioContext.setPlay(this.suffixs[+sessionStorage.getItem('index')]);
				}

				this.fav.highlightFavourite(sessionStorage.getItem('currentId'));
				this.constructor.highlight(+sessionStorage.getItem('index'));

				this.audioContext.audio.volume = this.volume;

				break;

			default:
				this.loader('add');

				this.speechAlert('Unknown command. Try again.');

				break;
		}

		if (sessionStorage.getItem('type') !== 'favourite') {
			this.constructor.highlight(+sessionStorage.getItem('index'));
		}
	}

	static highlight(indx) {
		[].forEach.call(document.querySelectorAll('[data-index]'), (el) => {
			el.classList.remove('active-track');
		});

		if (document.querySelector('[data-index="' + +indx + '"]')) {
			document.querySelector('[data-index="' + +indx + '"]').classList.add('active-track');
		}
	}

	getsuffixById(id) {
		for (let track in this.suffixs){
			if (!this.suffixs.hasOwnProperty(track)) {
				return;
			}

			if (this.suffixs[track].trackId === +id) {
				return this.suffixs[track];
			}
		}
	}

	language() {
		for (let i = 0; i < this.langs.length; i = i + 1) {
			selectLanguage.options[i] = new Option(this.langs[i][0], this.langs[i][1]);
		}

		selectLanguage.onchange = () => {
			this.recognition.lang = selectLanguage.value;
		};

		this.recognition.lang = selectLanguage.value;

	}

	refresh() {
		this.suffixs = [];
		this.index = 0;
		sessionStorage.setItem('index', 0);
	}

	loader(fn) {
		this.loadingElement.innerHTML = this.loadingCopy;

		if (fn === 'add'){
			this.loadingElement.classList.add('hidden');
		} else if (fn === 'remove'){
			this.loadingElement.classList.remove('hidden');
		}
	}

	sessions() {
		let sssuffix = sessionStorage.getItem('suffix');

		if (!sssuffix) {
			return;
		}

		this.loader('remove');

		utils.jsonp('https://itunes.apple.com/search?term=' + sssuffix + '&limit=' + this.limit, (data) => {
			this.api('play', data, sssuffix);
		});
	}

	speechAlert(msg) {

		if (this.speechNotification === 'speech'){

			this.utterance.text = msg;
			this.utterance.onend = () => {
				if (this.audioContext.audio !== null) {
					this.audioContext.audio.volume = this.volume;
				}
			};

			speechSynthesis.speak(this.utterance);

		} else if (this.speechNotification === 'alert') {
			alert(msg);

			if (this.audioContext.audio !== null) {
				this.audioContext.audio.volume = this.volume;
			}
		}

	}

	/*
	* Creation Thumbnail card layout via <template>
	*/
	static thumbnail(data, i) {
		let thumbnailContent = document.getElementById('thumbnail').content,
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
}