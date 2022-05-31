$('body').on('click', 'h1', function (e) {
    // console.log('apiTest');
//	if(false){
//		e.preventDefault();
//		var src = $('#browser img').prop('src');
//		x = getSrc(src)
//		var base = getBase64FromImageUrl(x);
//		console.log(base);
//		return;
//	}
    /*data = {action: 'editStatus', 
     data:{
     id:"173",
     time:'2015-12-05 07:30:00', 
     statusTypeName:"On duty",
     statusTypeId:'0', 
     note:'testasd',
     location:{lat:'30.21268333491144',long:'-91.9906297962341', locationName:'Dallas22, TX'}
     }};
     data = {action: 'getWSStatuses', 
     data:{
     ids:[{"id":859},{"id":1187},{"id":1188},{"id":1181},{"id":1180},{"id":1184},{"id":1185},{"id":1447},{"id":1179},{"id":866},{"id":867},{"id":1470},{"id":1170},{"id":1171},{"id":1324},{"id":1325},{"id":1175},{"id":1173},{"id":1279},{"id":1190}]
     }};
     createCookie('PHPSESSID', '8b6hjlb4n6961qaosvd8h6teu31478711909', 30);
     data = {action: 'deleteStatus', 
     data:{
     id:"181"
     }};
     data = {
     "data":{
     "time":"2016-10-26 04:40:39",
     "location":{"long":30.834243296998768,"lat":50.51463904833467,"locationName":"вулиця Джеймса Мейса, 16-18 Бровари Київська область"},
     "documents":["442","440","451","441"],"note":"hjj","statusTypeId":1},"action":"createStatus"};
     data = {"data":{"action":"getLogbookData","date":"10/27/2016","driverId":"if(now()=sysdate(),sleep(0),0)\/*'XOR(if(now()=sysdate(),sleep(0),0))OR'\"XOR(if(now()=sysdate(),sleep(0),0))OR\"*\/"}}
     data = {"data":{"action":"updateFleetData","cycle":0,"mainOffice":{"address":"e","city":"e","size":"(select(0)from(select(sleep(0)))v)\/*'+(select(0)from(select(sleep(0)))v)+'\"+(select(0)from(select(sleep(0)))v)+\"*\/","state":"Delaware","zip":"e"},"name":"e","tz":3}}
     data = {action: 'searchIfCarrierExistByUsdot', 
     data:{
     usdot:"441102"
     }};
     data={
     action:'updateUser',
     data:{
     firstName:'adas',
     lastName:'asdxzc',
     phone:'12312'
     }
     } 
     data = {action: 'choseTruck', 
     data:{
     id:"10"
     }};
     data = {action: 'getStates', 
     data:{
     
     }};
     data = {action: 'synchroniseDays', 
     data:{
     "days":{
     "2015-12-06":{
     "statuses":[
     {
     "id": 12312,
     "time": "2015-12-06 13:30:00 ",
     "statusTypeId": 1,
     "location": {
     "lat": 12.35258333291134,
     "long": -51.9406197952141,
     "locationName": "New York, TX"
     },
     "documents":[12, 13],
     "note": "I stopped for a launch"
     } 
     ],
     "logInfo":{
     
     },
     "dvir":{
     
     },
     "remarks":[
     ]
     }
     }
     }};
     data = {action: 'uploadSignatureById', 
     data:{
     id:7
     }};
     data = {action: 'choseTrailers', 
     data:{
     trailers:[{"id":10},{"id":12}]
     }};
     data = {action: 'sendDocEmail', 
     data:{
     email:"vedmak02@gmail.com",
     documents:['9', '317']
     }};
     data = {action: 'updateLogbookRules', 
     data:{
     cycle:{id:1}, 
     cargo:{id:1}, 
     restart:{id:1}, 
     restBreak:{id:1}, 
     wellSite:{id:1}, 
     logIncrement:{id:1}, 
     odometer:{id:1}, 
     timeZone:{id:2}
     }};*/
    // console.log('data began');
    data = {action: 'logIn',
        data: {
            email: 'asdasdasd@qqqq.vfvf',
            pass: '112233'
        }};
    // console.log('data end');
    /*
     data = {action: 'getDateDvirs', 
     data:{
     
     }};
     data = {action: 'choseTrailers', 
     data:{
     trailers:[
     {id:50}
     ]
     }};
     data = {action: 'sendInspectionEmail', 
     data:{
     'print_settings':{
     incl_recap:1,
     incl_dvir:1,
     same_page:1,
     incl_odometer:1,
     incl_docs:1},
     dates:[
     {date:'2016-02-15'},
     {date:'2016-02-16'}],
     email:'vedmak02@gmail.com'}};
     data = {action: 'getPlacesRating', 
     data:{
     ids:[
     {"id":18902},{"id":12583}
     ]
     }};
     data = {action: 'editDocument', 
     data:{
     "id":"169","type":"9","date":"2016-01-09","truckId":"3","reference":"tf5hftr","note":"ooooo","name":"267_1452357502.jpg"
     }};
     data = {action: 'sendLogbookData', 
     data:{
     date:'2016-10-21',
     shippingDocs:[{id:5}, {id:22}],
     coDrivers:'John Doe',
     trucks:[{id:5}, {id:22}],
     trailers:[{id:5}, {id:22}],
     notes:"asdads",
     homeTerminal:{
     address:'qweqew',
     city:3,
     state:3,
     zip:100
     },
     officeAddress:{
     address:'wqwe',
     city:3,
     state:2,
     zip:100
     },
     from:'IN',
     to:'WA',
     carrierName:'Some Carrier',
     signature:'',
     distances:[
     {
     state:'IL',
     truck:3,
     distance:100
     },
     {
     state:'WA',
     truck:3,
     distance:200
     }
     ]
     }};
     data = {action: 'getTestInfo', 
     data:{
     
     }};
     data = {action: 'getlogbookData', 
     data:{
     
     }};
     data = {action: 'checkMessages', 
     data:{
     dateTime:'2015-10-09 16:23:26'
     }};
     data = {action: 'searchByUsdot', 
     data:{
     usdot:'44110'
     }};
     data = {action: 'DVIR', 
     data:{
     date:'2015-12-29',
     trucks:[
     {
     id:123,
     location:'Portland',
     time:'15:05:32',
     odometer:'123',
     note:'123',
     signature:'',
     defects:[
     {
     id:12
     },
     {
     id:32
     }
     ],
     trailers:{
     ids:[
     {
     id:12
     },
     {
     id:32
     }
     ],
     defects:[
     {
     id:50
     },
     {
     id:43
     }
     ]
     }
     }
     ]
     }};
     /*data = {action: 'deleteDocument', 
     data:{
     id:'4'
     }};
     /**/
    $.ajax({
        url: MAIN_LINK+'/db/appController/',
        method: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify(data),
        success: function (data) {
            var response = jQuery.parseJSON(data);
                // console.log(response);
        }
    })
});
//function getBase64FromImageUrl(url) {
//    var img = new Image();
//
//    img.onload = function () {
//        var canvas = document.createElement("canvas");
//        canvas.width = this.width;
//        canvas.height = this.height;
//
//        var ctx = canvas.getContext("2d");
//        ctx.drawImage(this, 0, 0);
//
//        var dataURL = canvas.toDataURL("image/png");
//        data = {action: 'sendDocument',
//            data: {
//                imageArray: dataURL,
//                date: '2015-12-05 07:00:00',
//                note: 'ad',
//                type: '0',
//                truckId: '22',
//                price: '123',
//                gallons: '12'
//            }};
//        data = {action: 'uploadSignature',
//            data: {
//                imageArray: dataURL,
//                useAsMain: 1
//            }};
//        $.ajax({
//            url: '/db/appController/',
//            method: "POST",
//            contentType: "application/json", // send as JSON
//            data: JSON.stringify(data),
//            success: function (data) {
//                var response = jQuery.parseJSON(data);
//                if (response.code == '000') {
//                    console.log(response.data)
//                }
//            }
//        })
//    };
//
//    img.src = url;
//}
//var getSrc = function (imgSource) {
//    var img = new Image();
//    img.src = imgSource;
//    return img.src;
//};
