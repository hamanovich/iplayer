/*
 * Voice Player class IPlayer
*/

class IPlayer {
	constructor(options){
		if (window.webkitSpeechRecognition === 'undefined') {
			return;
		}

		this.options    = options || {};
		this.patience   = this.options.patience || 3;
		this.limit      = this.options.limit || 50;
		this.volume     = this.options.volume || 1;
		this.volumeWhenSpeak = this.options.volumeWhenSpeak || 0.1;
		this.loadingCopy = this.options.loading || 'Loading…';
		this.speechNotification = this.options.speechNotification || 'alert';

		this.langs = [
			['English', ['en-GB']],
			['Pусский', ['ru-RU']]
		];

		this.commands = {
			play:       ['play', 'find', 'search', 'найти'],
			next:       ['next', 'дальше', 'вперед'],
			previous:   ['previous', 'назад', 'предыдущий'],
			repeat:     ['repeat', 'повторить'],
			loop:       ['loop', 'зациклить'],
			autoplay:   ['autoplay', 'автовоспроизведение'],
			stop:       ['stop', 'стоп'],
			random:     ['random', 'произвольно'],
			volume:     ['volume', 'сделать'],
			mute:       ['mute', 'беззвучный'],
			like:       ['like', 'нравится', 'класс'],
			dislike:    ['dislike', 'плохо', 'ерунда'],
			go:         ['go', 'перейти']
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
	init() {
		let self = this,
			main = document.getElementById('main');


		function onStart() {
			console.log('onstart')
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
			let transcript = event.results[0][0].transcript,
				action = transcript.split(" ").splice(0, 1).join(' ').toLowerCase(),
				song = transcript.split(" ").splice(1).join(' ');

			restartTimer();

			resultAction(action, song);
		}

		function resultAction(action, song) {
			if (self.commands.play.indexOf(action) !== -1){
				self.refresh();
				self.loader('remove');

				utils.jsonp('https://itunes.apple.com/search?term=' + song + '&limit=' + self.options.limit, (data) => {
					self.api(data, action, song);
				});

			} else {
				self.api(null, action, song);
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

				audioContext.setPlay(self.songs[indx]);

				self.index = indx;
				indx = indx + 1;

				sessionStorage.setItem('index', self.index);

				self.highlight(+sessionStorage.getItem('index'));
			}

			if (el.classList.contains('favLink')){
				e.preventDefault();

				id = +el.closest('[data-id]').dataset.id;

				fav.highlightFavourite(id);

				utils.jsonp('https://itunes.apple.com/lookup?id=' + id, (data) => {
					audioContext.setPlay(data.results[0]);

					if (document.querySelector('.tune-wrap [data-id="'+ data.results[0].trackId + '"]')) {
						sessionStorage.setItem('index', document.querySelector('.tune-wrap [data-id="' + data.results[0].trackId + '"]').closest('[data-index]').dataset.index)

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

	api(data, action, song) {
		let tuneWrap = document.querySelector('.tune-wrap'),
			query = document.getElementById('search-query'),
			total = document.getElementById('search-total'),
			ssaction = (sessionStorage.getItem('action') === 'stop')
					? 'stop' : 'play',
			ssfavidList = sessionStorage.getItem('favId'),
			results,
			item,
			activeElement,
			artist,
			collection;

		for (let i in this.commands) {
			if (this.commands.hasOwnProperty(i)) {
				if (this.commands[i].indexOf(action) !== -1) {
					action = i;
				}
			}
		}

		sessionStorage.setItem('action', action);

		console.log(action)

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

				this.loader('add');

				for (item in results) {
					if (results[item] !== null && results.hasOwnProperty(item)){
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

				if (ssfavidList){
					utils.jsonp('https://itunes.apple.com/lookup?id=' + ssfavidList, (data) => {
						for (let i = 0; i < data.results.length; i = i + 1){
							fav.updateFavouritesLikes(data.results[i]);
						}
					});
				}

				break;

			case 'repeat':

				audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

				break;

			case 'autoplay':

				audioContext.audio.autoplay = (audioContext.audio.autoplay === true) ? false: true;
				audioContext.audio.volume = this.volume;

				break;

			case 'loop':

				audioContext.audio.loop = (audioContext.audio.loop === true) ? false: true;
				audioContext.audio.volume = this.volume;

				break;

			case 'next':

				if (+sessionStorage.getItem('index') > this.songs.length - 2){
					sessionStorage.setItem('index', -1);
				}

				sessionStorage.setItem('index', +sessionStorage.getItem('index') + 1);
				audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

				break;

			case 'random':
				let randTrack = utils.getRandomInt(0, this.limit);

				sessionStorage.setItem('index', +randTrack);
				audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

			case 'previous':

				if (+sessionStorage.getItem('index') === 0){
					+sessionStorage.setItem('index', this.songs.length);
				}

				+sessionStorage.setItem('index', +sessionStorage.getItem('index') - 1);
				audioContext.setPlay(this.songs[+sessionStorage.getItem('index')]);

				break;

			case 'stop':

				audioContext.setStop();

				break;

			case 'volume':

				if (song === 'up' || song === 'громче'){
					if (this.volume < 1) {
						this.volume += 0.2;
					}
				} else if (song === 'down' || song === 'тише'){
					if (this.volume > 0) {
						this.volume -= 0.2;
					}
				}

				audioContext.audio.volume = this.volume;

				break;

			case 'mute':

				audioContext.audio.muted =
						(audioContext.audio.muted === true) ? false : true;

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

				if (song === 'to artist' || song === 'автор'){
					window.open(artist, '_blank');
				} else if (song === 'to collection' || song === 'коллекция'){
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

	highlight(indx) {
		[].forEach.call(document.querySelectorAll('[data-index]'), (el) => {
			el.classList.remove('active-track');
		});

		document.querySelector('[data-index="' + +indx + '"]').classList.add('active-track');
	}

	getSongById(id) {
		for (let track in this.songs){
			if (!this.songs.hasOwnProperty(track)) {
				return;
			}

			if (this.songs[track].trackId === +id) {
				return this.songs[track];
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
		this.songs = [];
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
		let sssong = sessionStorage.getItem('song'),
			ssfavidList = sessionStorage.getItem('favId');

		if (!sssong) {
			return;
		}

		this.loader('remove');

		utils.jsonp('https://itunes.apple.com/search?term=' + sssong + '&limit=' + this.options.limit, (data) => {
			this.api(data, 'play', sssong);

			if (ssfavidList){
				utils.jsonp('https://itunes.apple.com/lookup?id=' + ssfavidList, (data) => {
					for (let i = 0; i < data.results.length; i = i + 1){
						fav.updateFavourites(data.results[i]);
					}
				});
			}
		});


	}

	speechAlert(msg) {

		if (this.speechNotification === 'speech'){

			this.utterance.text = msg;
			this.utterance.onend = (e) => {
				if (audioContext.audio !== null) {
					audioContext.audio.volume = this.volume;
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
	thumbnail(data, i) {
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

	/*
	 * Creation Favourite list layout via <template>
	 */
	favourites(data, i) {
		let favContent = document.getElementById('favourites').content,
			favWrap = document.querySelector('.favourites');

		favWrap.appendChild(document.importNode(favContent, true));

		if (!sessionStorage.getItem('favId')){
			favWrap.classList.add('hidden');
		} else {
			favWrap.classList.remove('hidden');
		}
	}

}