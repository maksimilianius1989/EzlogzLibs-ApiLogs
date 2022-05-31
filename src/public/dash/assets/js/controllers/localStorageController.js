function localStorageController() {
	var self = this;
	this.getStringOption = function (key) {
		if(!self.checklocalStorageAvailable())
			return null;
		var optionValue = localStorage.getItem(key);
		return optionValue;
	}
	this.getObjectOption = function (key) {
		var objStr = self.getStringOption(key);
		var obj = JSON.parse(objStr);
		return obj;
	}
	this.setOption = function (key, value) {
		if(self.checklocalStorageAvailable() && !self.isQuotaExceeded()){
			if(typeof value === "object" && value!== null){
				value = JSON.stringify(value);
			}
			localStorage.setItem(key, value);
		}
	}
	this.setOptionParams = function (optionId, params) {
		var optionObj = self.getObjectOption(optionId);
		//if options list not exist, create it
		if(optionObj == null) {
			optionObj = {};
		}
		$.each(params, function (key, param) {
			//if param not exist or has new value
			if(typeof optionObj[key]== 'undefined' || optionObj[key]!= param){
				optionObj[key] = param;
				self.setOption(optionId, optionObj);
			}
		});
		c(optionObj);
	}
	this.removeOption = function (key) {
		if(self.checklocalStorageAvailable()){
			localStorage.removeItem(key);
		}
	}
	this.clearAll = function () {
		if(self.checklocalStorageAvailable()){
			localStorage.clear();
		}
	}
	this.isQuotaExceeded = function(e) {
		var quotaExceeded = false;
		if (e) {
			if (e.code) {
				switch (e.code) {
					case 22:
						quotaExceeded = true;
						break;
					case 1014: // Firefox
						if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
							quotaExceeded = true;
						}
						break;
				}
			} else if (e.name === 'QuotaExceededError'){ // everything except Firefox
				quotaExceeded = true;
			} else if (e.number === -2147024882) { // Internet Explorer 8
				quotaExceeded = true;
			}
		}
		return quotaExceeded;
	}
	this.checklocalStorageAvailable = function() { c('checklocalStorageAvailable');
		if (typeof localStorage === 'undefined' || localStorage === null) {
			return false;
		}
		try {
			var storage = window['localStorage'],
				x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch(e) {
			return false;
			//return e instanceof DOMException;
		}
	}
	this.checkCustomSettings = function() {
		$('.saveCustom').each(function() {
			var fieldStoreId = $(this).attr('data-save');
			self.checkOneCustomSetting(fieldStoreId);
		});
	}
	this.checkOneCustomSetting = function(fieldStoreId) { c('checkOneCustomSetting');
		var fieldStoreValue = self.getStringOption(fieldStoreId);
		//c('storeId='+fieldStoreId+', storeValue='+fieldStoreValue);
		if(fieldStoreValue!== null){
			var $element = $('.saveCustom[data-save="'+fieldStoreId+'"]');
			if($element.is('input')){
				$element.val(fieldStoreValue);
			} else if($element.is('select')) {
				$element.find('option').removeAttr('selected').filter('[value="'+fieldStoreValue+'"]').prop('selected', true);
			}
		}
	}
}
var userLocalStorage = new localStorageController();