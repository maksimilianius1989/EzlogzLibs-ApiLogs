function fileUploader(el, callback) {
    var self = this;
    this.el = $(el);
    this.input = $('<input type="file" accept="*" style="display:none;">');
    // $('main.content').append(this.input);
    $('body').append(this.input);
    this.name = '';
    this.size = '';
    this.extension = '';
    this.src = '';
    this.type = '';
    this.url = adminUrl;

    this.toFixedFloat = function(num, am){
        return parseFloat(parseFloat(num).toFixed(am));
    };

    this.uploadFile = function () {
        var input = self.input[0];
        if (input.files.length == 0) {
            return false;
        }

        var fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx','gif', 'jpg', 'jpeg', 'png'];
        if (input.files && input.files[0]) {
            self.extension = input.files[0].name.split('.').pop().toLowerCase();  //file extension from input file
            self.size = input.files[0]['size'];
            self.name = input.files[0]['name'];
            self.type = input.files[0]['type'];
            // c(input.files);
            self.sizeMb = self.toFixedFloat(self.size / 1000000, 2);
            if (self.size > 10000000) {//max 10 mb
                alert('File too big, maximum 10mb');
                return false;
            }
            var reader = new FileReader();
            if (self.type == '') {
                alert('Unknown format');
                return false;
            } else if (fileTypes.indexOf(self.extension) < 0) {
                alert('Invalid file');
                return false;
            } else {
                reader.onload = function (e) {
                    c(e);
                    self.src = e.target.result;
                    if(typeof callback !== 'undefined') {
                        $(self.el).data(self);
                        callback(self.el);
                    }
                    self.input.remove();
                };
            }
            reader.readAsDataURL(input.files[0]);

        }
    };

    this.input.change(this.uploadFile);
    this.input.click();
}



