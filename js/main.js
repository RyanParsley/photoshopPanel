var MAX_IMAGE_RESULTS = 30;

var lightSpinner = new Spinner({ lines: 30, length: 0, width: 2, radius: 8, corners: 0, color: '#fff', speed: 2, trail: 100, hwaccel: true, className: 'spinner', zIndex: 2e9 }).spin();
var darkSpinner  = new Spinner({ lines: 30, length: 0, width: 2, radius: 8, corners: 0, color: '#777', speed: 2, trail: 100, hwaccel: true, className: 'spinner', zIndex: 2e9 }).spin();
var csInterface  = new CSInterface();

var cleanFileName = function(name) {
  name = name.split(' ').join('-');
  return name.replace(/\W/g, '');
};

var createTempFolder = function() {
  var tempFolderName = 'com.psdserver.extension/';
  var tempFolder = '/tmp/' + tempFolderName;
  if (window.navigator.platform.toLowerCase().indexOf('win') > -1) {
    tempFolder = csInterface.getSystemPath(SystemPath.USER_DATA) + '/../Local/Temp/' + tempFolderName;
  }
  window.cep.fs.makedir(tempFolder);
  return tempFolder;
};

var downloadAndOpenInPhotoshop = function(url, name, thumb) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    if (this.status == 200 || this.status == 304) {
      var uInt8Array = new Uint8Array(this.response);
      var i = uInt8Array.length;
      var binaryString = new Array(i);
      while (i--)
        binaryString[i] = String.fromCharCode(uInt8Array[i]);
      var data = binaryString.join('');
      var base64 = window.btoa(data);

      var downloadedFile = createTempFolder() + name + '.psd';
      
      window.cep.fs.writeFile(downloadedFile, base64, cep.encoding.Base64);
      csInterface.evalScript('openDocument("' + downloadedFile + '")');
      $('.container').masonry('remove', thumb);
      $('.container').masonry('reload');
    }       
  };
  xhr.send();
};

var addThumbToContainer = function(photo) {
  var thumb_url = 'http://psdserver.cinlindev.rfisite.com/assets/thumbs/'+photo.id+'.jpg';
  var real_image_url = 'http://psdserver.cinlindev.rfisite.com/assets/'+photo.id+'.psd';
  var thumb = $('<div class="thumb"><div class="overlay"></div><img title="'+ photo.title +'" src="' + thumb_url + '" ></img><p>'+photo.title+'</p></div>').appendTo('.container');
    csInterface.
  thumb.click(function() {
    var overlay = thumb.find('.overlay');
    thumb.addClass('downloading');
    overlay.append($(lightSpinner.el).clone());
    overlay.show();
    downloadAndOpenInPhotoshop(real_image_url, cleanFileName(photo.title), thumb);
  })
};

var setupMasonry = function() {
  var gutterWidth = 2;
  $('.container').masonry({
    isAnimated: true,
    itemSelector: '.thumb',
    gutterWidth: gutterWidth,
    columnWidth: function(containerWidth) {
      var boxes = Math.ceil(containerWidth / 150);
      var totalGutterSpace = (boxes - 1) * gutterWidth;
      var boxWidth = Math.floor((containerWidth - totalGutterSpace) / boxes);
      $('.thumb').width(boxWidth);
      return boxWidth;
    }
  });
}

var loadRemote = function() {
  var url = 'http://psdserver.cinlindev.rfisite.com/rest.json';

  $('.loading-spinner').show();
  $('.container').hide();
  $('.container').empty();
  $.getJSON(url, function (response) {
    $.each(response.photos.photo, function(i, photo) {
      if (i >= MAX_IMAGE_RESULTS) {
        return;
      }
      addThumbToContainer(photo);
    });

    $('.container').imagesLoaded(function() {
      setupMasonry();
      $('.container').fadeIn('slow');
      $('.container').masonry('reload');
      $('.loading-spinner').hide();
    });
  });
};

var main = function() {
  $('.loading-spinner').append(darkSpinner.el);
  loadRemote();
};
main();