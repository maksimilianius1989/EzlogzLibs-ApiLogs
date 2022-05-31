var Validate = function(){
    var self = this;
    
    //Regular Expressions
    this.regexp_LtLn = /-?\d{1,3}\.\d+/;
    this.regexp_Email = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.regexp_URL = /^(ftp|http|https):\/\/[^ "]+$/;
    
    //Validate Methods
    this.validateLtLn = function(ltln){
        return self.regexp_LtLn.test(ltln);
    };
    this.validateEmail = function(email){
        return self.regexp_Email.test(email);
    };
    this.validateURL = function(url){
        return self.regexp_URL.test(url);
    };
    this.zip = function(zip = ''){
        return (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/).test(zip) || (/^\d{4,6}$/).test(zip);
    };

    this.name = function(name = '', $obj = ''){
        if (!name || typeof name === 'undefined')
            setError($obj, 'Enter First Name');
        else if (!/^[a-zA-Z\s,'-]*$/.test(name))
            setError($obj, 'Enter only Latin letters');
        else if (name.length > 64)
            setError($obj, 'Max allowed 64 characters');
    };
    this.last = function(name = '', $obj = ''){
        if (!name || typeof name === 'undefined')
            setError($obj, 'Enter Last Name');
        else if (!/^[a-zA-Z\s,'-]*$/.test(name))
            setError($obj, 'Enter only Latin letters');
        else if (name.length > 64)
            setError($obj, 'Max allowed 64 characters');
    };
    this.email = function(email = '', $obj = ''){
        if(email == '' || !self.validateEmail(email))
            setError($obj, 'Enter valid email');
        else if(email.length > 75)
            setError($obj, 'Max allowed 75 characters');
    };
    this.phone = function(phone = '', $obj = ''){
        if (phone.length !== 12)
            setError($obj, 'Phone length must be 10 characters');
    };
    this.carrierName = function(name = '', $obj = ''){
        if (!name)
            setError($obj, 'Enter carrier name');
        else if (!/^[a-zA-Z0-9\s,'-/&/#]*$/.test(name))
            setError($obj, 'Enter only Latin letters');
        else if (name.length > 130)
            setError($obj, 'Max allowed 130 characters');
    };
    this.companyName = function(name = '', $obj = ''){
        if (!name)
            setError($obj, 'Enter company name');
        else if (!/^[a-zA-Z0-9\s,'-/&/#]*$/.test(name))
            setError($obj, 'Enter only Latin letters');
        else if (name.length > 130)
            setError($obj, 'Max allowed 130 characters');
    };


}
var validate = new Validate();