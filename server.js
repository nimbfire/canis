// Canis server v1

var http = require('http');
var spawn = require('child_process').spawn

//Lets define a port we want to listen to
const PORT=8080;

var ps = null;


//We need a function which handles requests and send response
function handleRequest(request, response){
  if (request.url == '/') {
    response.end('welcome');
  }
  else if (request.url === '/audio.wav') {
  //url /audio.wav starts streaming from usb mic
    console.log('Request for audio file')
    audioRequest(request, response);
  }
  else if (request.url === '/base') {
  //url /audio.wav starts streaming from usb mic
    console.log('Request for base')
    base(request, response);
  }
  else {
    response.end('It Works!! Path Hit: ' + request.url);
    console.log('Path hit ' + request.url);
  }
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});

function audioRequest(req, res) {

  console.log('Request for audio file')

  //if command is not started, start it
  if (ps === null) {
    res.writeHead(200,{'Content-Type': 'audio/wav'})

    console.log('Spawning arecord')
    ps = spawn('arecord',['-D','plughw:0,0','-f','dat'])

    ps.stderr.on('data', function (data) {
      console.log('stderr: ' + data)
    })

    ps.stdout.on('data', function (data) {
      console.log('sending audio to client ')
      res.write(data)
    })

    ps.on('exit', function (code) {
      ps = null
      res.end()
      console.log('child process exited with code ' + code)
    })

    res.on('end',function(){
      console.log('End of stream')
    })

    res.on('close',function(){
      console.log('stream got closed by client')
      //end it if stream gets closed.
      ps.kill('SIGHUP')
    })

  } else {
    console.log('USB mic already taken')
    res.writeHead(503,{'Content-Type': 'text/html'})
    res.end('<html><head><title>Service Unavailable</title></head><body>Mic stream is already taken.</body></html>')
  }

}
function base(req, res) {
    //everything else just sends a html response with an audio tag
    res.writeHead(200,{'Content-Type': 'text/html'})
    res.write('<!DOCTYPE html>')
    res.write('<html>')
    res.write('<head>')
    res.write('<title>Simple MIC Stream</title>')
    res.write('</head>')
    res.write('<body>')
    res.write('<audio src="/audio.wav" preload="none" controls > ')
    res.write('</audio>')
    res.write('</body>')
    res.write('</html>')
    res.end()
}
