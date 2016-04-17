class Utils {
	jsonp(url, callback) {
		let callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random()),
			script;

		window[callbackName] = (data) => {
			delete window[callbackName];
			document.body.removeChild(script);
			callback(data);
		};

		script = document.createElement('script');
		script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;

		document.body.appendChild(script);
	}

	toCapitalize(str) {
		return str.length ? str[0].toUpperCase() + str.slice(1) : str;
	}

	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
}

let utils = new Utils();
//
//Storage.prototype.setObject = function(key, value) {
//	this.setItem(key, JSON.stringify(value));
//}
//
//Storage.prototype.getObject = function(key) {
//	var value = this.getItem(key);
//	return value && JSON.parse(value);
//}