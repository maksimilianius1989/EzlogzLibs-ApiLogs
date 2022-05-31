function CloudController()
{
    let self = this;

    self.apiUrl = '/db/api/apiCloudController.php';

    let intervalDuration = 120000;//2 minutes

    self.getLastLocationByMacAddres = function (reqData) {
        let data = {};
        data.userId = reqData.userId;
        data.macAddres = reqData.macAddres;

        cloudC_IntervalData = data;

        let params = {};
        params.action = 'getLastLocationByMacAddres';
        params.data = data;
        params.url = self.apiUrl;
        params.successHandler = self.getLastLocationByMacAddresHandler;
        AjaxCall(params);
    }
    self.getLastLocationByMacAddresHandler = function (response) {
        if (response.code == '000') {
            let resData = response.data.resData;
			
            if (typeof resData[0].errorCode != 'undefined') {
				console.log('here');
                self.clearInterval();
                cloudC_NoScanner = true;
                liveUpdateC.subscribeForLocations(cloudC_IntervalData.userId);
                return false;
            }

            let mutationData = {}
            mutationData.userId = cloudC_IntervalData.userId;
            mutationData.lat = resData[0].locations[0].lat;
            mutationData.lng = resData[0].locations[0].lng;
            mutationData.fuelPercent = resData[0].locations[0].fuellevel;
            mutationData.fuelRate = 0;
            mutationData.speed = resData[0].locations[0].speedmph;
            mutationData.voltage = resData[0].locations[0].batteryvoltage/1000;
            logbook.updateMarkerLocation(mutationData);
        } else {
            self.clearInterval();
            cloudC_NoScanner = true;
            liveUpdateC.subscribeForLocations(cloudC_IntervalData.userId);
            return false;
        }
    }
    self.runInterval = function () {
        self.clearInterval();
        cloudC_Interval.push(setInterval(() => {
            cloudC.getLastLocationByMacAddres(cloudC_IntervalData);
        }, intervalDuration));
    }
    self.clearInterval = function () {
        for ($i = 0; $i <= cloudC_Interval.length; $i++) {
            clearInterval(cloudC_Interval[$i]);
        }
        cloudC_Interval = [];
    }
}

cloudC_NoScanner = false;
cloudC_IntervalData = {};
cloudC_Interval = [];

cloudC = new CloudController();