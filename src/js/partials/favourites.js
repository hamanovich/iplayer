class Favourite {
	favApi(action) {
		let favList = document.querySelector('.fav-list'),
			favChilds = favList.children,
			favListNodes = Array.prototype.slice.call(favChilds),
			favLength = favListNodes.length,
			firstId = favChilds[0].dataset.id,
			lastId = favChilds[favLength - 1].dataset.id,
			favActive = favList.querySelector('.active') || favChilds[favLength - 1],
			activeId = favActive.dataset.id,
			activePrev = (activeId !== firstId) ? favActive.previousElementSibling : favChilds[favLength - 1],
			activeNext = (activeId !== lastId) ? favActive.nextElementSibling : favChilds[0];

		switch (action) {
			case 'play':

				favChilds[0].children[0].click();

				break;

			case 'next':

				activeNext.children[0].click();

				break;

			case 'prev':

				activePrev.children[0].click();

				break;
		}
	}

	addToFavourite() {
		let favWrap = document.querySelector('.favourites'),
				favList = favWrap.querySelector('.fav-list'),
				li = document.createElement('li'),
				a = document.createElement('a'),
				id = sessionStorage.getItem('currentId'),
				likedIcon = document.querySelector('.active-track .liked');

		if (!favList.querySelector('[data-id="' + id + '"]')){
			a.setAttribute('href', audioContext.audio.src);
			a.setAttribute('class', 'favLink');
			a.innerHTML = audioContext.audio.title;

			li.dataset.id = id;
			li.appendChild(a);
			favList.appendChild(li);

			likedIcon.classList.add('selected');

			sessionStorage.setItem('favId',
					(sessionStorage.getItem('favId')
							? (sessionStorage.getItem('favId') + ',')
							: '') + audioContext.audio.id);
		}

		if (sessionStorage.getItem('favId')){
			favWrap.classList.remove('hidden');
			this.highlightFavourite(sessionStorage.getItem('currentId'));
		}
	}

	removeFromFavourite() {
		let favWrap = document.querySelector('.favourites'),
				favList = favWrap.querySelector('.fav-list'),
				id = sessionStorage.getItem('currentId'),
				likedIcon = document.querySelector('[data-id="' + id + '"] .liked'),
				ssfavidArray = sessionStorage.getItem('favId').split(','),
				idIndex = ssfavidArray.indexOf(id);

		this.favApi('next');

		favList.removeChild(favList.querySelector('[data-id="' + id + '"]'));
		ssfavidArray.splice(idIndex, 1);

		likedIcon.classList.remove('selected');

		sessionStorage.setItem('favId', ssfavidArray.join());

		if (!sessionStorage.getItem('favId') || !sessionStorage.getItem('favId').length){
			favWrap.classList.add('hidden');
		}
	}

	updateFavourites(track) {
		let favWrap = document.querySelector('.favourites'),
				favList = favWrap.querySelector('.fav-list'),
				li = document.createElement('li'),
				a = document.createElement('a');

		a.setAttribute('href', track.previewUrl);
		a.setAttribute('class', 'favLink');
		a.innerHTML =  track.artistName + ' — ' + track.trackName;

		li.dataset.id = track.trackId;
		li.appendChild(a);
		favList.appendChild(li);

		this.updateFavouritesLikes(track);
	}

	updateFavouritesLikes(track){
		if (document.querySelector('[data-id="'+ track.trackId + '"] .liked')){
			document.querySelector('[data-id="'+ track.trackId + '"] .liked').classList.add('selected');
		}
	}

	highlightFavourite(id) {
		[].forEach.call(document.querySelectorAll('.favourites [data-id]'), (el) => {
			el.classList.remove('active');
		});

		if (document.querySelector('.favourites [data-id="' + id + '"]')) {
			document.querySelector('.favourites [data-id="' + id + '"]').classList.add('active');
		}
	}

}

let fav = new Favourite();