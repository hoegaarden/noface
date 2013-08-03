var http = require('http')
  , connect = require('connect')
  , fs = require('fs')
  , formidable = require('formidable')
  , gm = require('gm')
  , faced = new (require('faced'))()
  , app = connect()
  , port = process.env.npm_package_config_http_port
;

app
  .use(connect.logger())
  .use(connect.limit('5mb'))
;

app.use(function(req, res, next){
  if (req.method === 'POST') {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      if (err) {
        res.statusCode(400);
        res.end('siome error occured', err);
      }

      var file = files.file;

      res.on('header', function(){
        fs.unlink(file.path, function(err){
          if (err)
            console.warn('problem on unlinkg file', err);
        });
      });

      faced.detect(file.path, function(faces, image){
        var img = gm( image.toBuffer() );

        res.setHeader('X-Faces-Found', faces.length);
        res.setHeader('Content-Type', file.type);

        faces.forEach(function(face){
          var x0 = face.getX()
            , x1 = face.getX2()
            , y0 = face.getY()
            , y1 = face.getY2()
          ;

          img.region(x1-x0, y1-y0, x0, y0).noise(30);
        }); // face.forEach(...)

        img.stream().pipe(res);
      }); // faced.detect(...)

    }); // form.parse(...)
  } else {
    res.write('<html><body>');
    res.write('<form method="POST" enctype="multipart/form-data">');
    res.write('<input type="file" name="file" />');
    res.write('<input type="submit" value="upload" />');
    res.write('</form>');
    res.end('</body></html>');
  }
});

http.createServer(app).listen(port, function(s){
    console.log( 'listening on', port );
});