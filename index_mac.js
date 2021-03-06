var fs = require('fs')
  , http = require('http')
  , open = require('open');

var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

http.createServer(function (req, res) {


  if (!fs.existsSync(config.outputFolder))
    fs.mkdirSync(config.outputFolder);
  if (!fs.existsSync(config.outputFolder+'/Android'))
    fs.mkdirSync(config.outputFolder+'/Android');
  if (!fs.existsSync(config.outputFolder+'/iOS'))
    fs.mkdirSync(config.outputFolder+'/iOS');

  loadReqBody(req, function(parsedReqBody) {
    switch (req.url) {
      case '/':
        loadMainPage(function(pageBody) {
          res.writeHead(200, {"Content-Type": 'text/html'});
          res.end(pageBody);
        });
        break;
      case '/save_image':
        saveImage(parsedReqBody, function(err, msg) {
          res.writeHead(200, {"Content-Type": 'application/json'});
          res.end(JSON.stringify(err ? { msg: err.toString() } : msg));
        });
        break;
      case '/get_image_list':
        res.writeHead(200, {"Content-Type": 'application/json'});
        res.end(JSON.stringify(config.input));
        break;
      case '/all_is_done':
        res.writeHead(200, {"Content-Type": 'application/json'});
        res.end(JSON.stringify({ msg: 'cool' }));
        console.log('All is done!');
        process.exit(0);
        break;
      default:
        fs.readFile(__dirname + req.url, function (err, data) {
          res.writeHead(!err ? 200 : 404, {"Content-Type": 'image/svg+xml'});
          res.end(data);
        });
    }
  });
})
.listen(config.server.port, config.server.hostname, null, function() {
  open('http://' + config.server.hostname + ':' + config.server.port);
});

function loadMainPage(callback) {
  fs.readFile(__dirname + '/index.htm', function (err, data) {
    if (err)
      throw err;

    callback(data);
  });
}



function strEndsWith(str,suffix) {
  var reguex= new RegExp(suffix+'$');

  if (str.match(reguex)!=null)
      return true;

  return false;
}



function saveImage(options, callback) {
var regexdpi = /^.*dpi$/
var regex1x = /^.*1x$/

  var regex = regex  = /^data:.+\/(.+);base64,(.*)$/
    , matches = options.body.match(regex)
    , imageExt = matches[1]
    , imageBody = new Buffer(matches[2], 'base64');
	
    var imagePath;
	var imageName;
	
  if (regexdpi.test(options.type)) {
		imagePath = config.outputFolder + '/Android/drawable-' + options.type + '/';
		imageName = options.name + '.' + imageExt
	} else {
		imagePath = config.outputFolder + '/iOS/';
		if (regex1x.test(options.type)) {
		imageName = options.name+ '.' + imageExt;
		} else {
		imageName = options.name+'@'+options.type+ '.' + imageExt;
		}
	}

  if (!fs.existsSync(imagePath))
    fs.mkdirSync(imagePath);

  fs.writeFile(imagePath+imageName, imageBody, function(err) {
    if (err)
      throw err;

    var msg = 'File ' + imagePath+imageName + ' is created.';

    console.log(msg);
    callback(err, { msg: msg });
  });
}

function loadReqBody(req, callback) {
  var chunks = [];

  req.on('data', function(chunk) {
    chunks.push(chunk);
  });

  req.on('end', function(chunk) {
    var reqBody = '';

    chunks.push(chunk);
    chunks.forEach(function(chunk) {
      reqBody += chunk ? chunk.toString() : '';
    });

    try {
      reqBody = JSON.parse(reqBody);
    } catch(e) {
      reqBody = null;
    }

    callback(reqBody);
  });
}


