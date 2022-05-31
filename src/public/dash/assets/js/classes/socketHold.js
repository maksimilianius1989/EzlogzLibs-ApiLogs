function socketLogin2() {
	c('socketLogin2');
	var data = {
		action: 'login',
		data: {
			session: getCookie("session"),
			timezone: timeOffset / 3600,
			web: 1,
			dashboard: ''
		}
	};
	if (inFleet == 1 && userRole == 1 && (position == TYPE_DRIVER || position == TYPE_DRIVER_ELD) && getCookie("dashboard") == 'driver') {
		data.data.dashboard = 'driver';
	}
	c(data);
	c('socketLogin22')
	send(data);
} 
function Socket_Hold() {
	this.socket = io.connect(SOCKET_ADDR, {query: "foo=bar"});

	this.initsock = function () {
		this.socket.on('created', function (newUser) {
			// console.log('Socket created');
		});
		this.socket.on('onopen', function (newUser) {
			// console.log('Socket onopen');
			socketLogin2();
			getUsersOnlineStatus();
		});
		this.socket.on('action', function (data) {
			// console.log(data);
            if(data.action+'Handler' in dcc){
                dcc[data.action+'Handler'](data);
            } else if(data.action+'Handler' in wpc){
                wpc[data.action+'Handler'](data)
            } else if(data.action+'Handler' in plcApi){
                plcApi[data.action+'Handler'](data);
            }
		});
		this.socket.on('reconnect_error', function (e) {
			// console.log('reconnect_error Failed');
			c(e);
		});
		this.socket.on('connect_error', function (e) {
			// console.log('connect_error Failed');
			c(e);
		});
		this.socket.on('error', function (e) {
			// console.log(e+'error Failed');
		});
		this.socket.on('connect_failed', function () {
			// console.log('connect_failed Failed');
		});
		this.socket.on('connect', function () {
			// console.log('Connected');
		});
		this.socket.on('disconnect', function () {
			// console.log('Disconnected');
		});
	}
}

soc = new Socket_Hold();
soc.initsock();
function send(data) {
	c('send2');
	c(data);
	soc.socket.emit('action', data)
}