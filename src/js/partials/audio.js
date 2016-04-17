class AudioContext {
	constructor () {
		this.audio = null;
	}

	setPlay(track) {
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

	setStop() {
		if (this.audio !== null) {
			this.audio.pause();
			this.audio.currentTime = 0;
		}
	}

	onEnd(e){
		if (this.autoplay) {
			iPlayer.api(null, 'next', sessionStorage.getItem('song'));
		}
	}

	timeUpdate() {
		let timeline = document.querySelector('.timeline'),
				progressBar = timeline.querySelector('.progress-bar'),
				duration = this.duration,
				currentTime = this.currentTime,
				currentRate = currentTime * 100 / duration;

		if (currentRate > 100){
			currentRate = 100;
		}

		timeline.classList.remove('hidden');
		progressBar.style.width = currentRate + '%';
	}
}

let audioContext = new AudioContext();