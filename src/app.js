import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import favicon from 'serve-favicon';
import fs from 'fs';
import formidable from 'formidable';

const app = express(),
  storageFolderName = 'files',
  storageFolderLocation = '../files',
  vars = {
    title: 'fise.js',
    devStatic: '/static',
    virtualStorage: '/served-files'
  };

// uncomment next line to compile readable html
app.locals.pretty = true;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname, 'assets', 'img', 'node-js.ico')));
app.use(vars.virtualStorage, express.static(path.join(__dirname, storageFolderLocation)));
app.use(vars.devStatic, express.static(path.join(__dirname, 'assets')));

app.get('/*', (req, res) => {
  let message = ((req.query.type && req.query.title && req.query.body) && (req.query.type=='success' || req.query.type=='info' || req.query.type=='warning' || req.query.type=='danger')) ? req.query : null;
  let url = req.params[0], arrTemp = [], arrUrl = [], arrBreadcrumbs = [], extraUrl = '';

  if(url.length > 0){
    arrTemp = url.split('/');
    for(let i = 0; i < arrTemp.length; i++){
      if(arrTemp[i].length > 0){
        extraUrl += '/' + arrTemp[i];
        arrUrl.push(arrTemp[i]);
      }
    }
    for(let i = 0; i < arrUrl.length; i++){
      if(i>0){
        let temp = arrBreadcrumbs[i-1];
        arrBreadcrumbs[i] = temp + '/' + arrUrl[i];
      } else {
        arrBreadcrumbs[i] = '/' + arrUrl[i];
      }
    }
  }
  let dirs = listDirsFiles(path.join(__dirname, storageFolderLocation, extraUrl), 'directories');
  let files = listDirsFiles(path.join(__dirname, storageFolderLocation, extraUrl), 'files');

  res.render('index', { vars, dirs, files, extraUrl, arrUrl, arrBreadcrumbs, message });
});

app.post('/godir', (req, res) => {
  res.redirect(req.body.goto);
});

app.post('/uploadfile', (req, res) => {
  let form = new formidable.IncomingForm();
  form.multiples = true;
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    let msgString = '',
      uploadDir = path.join(process.env.PWD, storageFolderName, fields.uploaddir),
      newFilename = fields.filename,
      filesNumber = (files.fileobject.length >= 2) ? files.fileobject.length : 1;

    if(filesNumber==1){
      let origFilename = files.fileobject.name;
      let tempPath = files.fileobject.path;
      let lastPath = '';
      let fileExt = '';

      if(origFilename.lastIndexOf('.') > 0){
        fileExt = '.' + origFilename.split('.').pop();
      }

      if(newFilename.length > 0){
        lastPath = path.join(uploadDir, newFilename) + fileExt;
      } else {
        lastPath = path.join(uploadDir, origFilename);
      }

      let bufferFile = fs.readFileSync(tempPath);
      fs.writeFileSync(lastPath, bufferFile);
      msgString += '?title=' + encodeURIComponent('Success!') + '&body=' + encodeURIComponent('File uploaded successfully') + '&type=success';
    } else if(filesNumber>1){
      for(let i = 0; i < filesNumber; i++){
        let origFilename = files.fileobject[i].name;
        let tempPath = files.fileobject[i].path;
        let lastPath = '';
        let fileExt = '';

        if(origFilename.lastIndexOf('.') > 0){
          fileExt = '.' + origFilename.split('.').pop();
        }

        if(newFilename.length > 0){
          lastPath = path.join(uploadDir, newFilename + (i+1)) + fileExt;
        } else {
          lastPath = path.join(uploadDir, origFilename);
        }

        let bufferFile = fs.readFileSync(tempPath);
        fs.writeFileSync(lastPath, bufferFile);
      }
      msgString += '?title=' + encodeURIComponent('Success!') + '&body=' + encodeURIComponent('All files has been uploaded successfully') + '&type=success';
    }

    let load = (fields.uploaddir.length > 0) ? fields.uploaddir : '/';
    res.redirect(load + msgString);
  });
});

// disabling x-powered-by
app.disable('x-powered-by');

function listDirsFiles(location, lookFor){
  let list = fs.readdirSync(location), items = [];

  if(lookFor == 'directories'){
    list.forEach((fileOrDir) => {
      if(fs.statSync(path.join(location, fileOrDir)).isDirectory()){
        items.push(fileOrDir);
      }
    });
  } else if(lookFor == 'files'){
    list.forEach((fileOrDir) => {
      if(fs.statSync(path.join(location, fileOrDir)).isFile()){
        items.push(fileOrDir);
      }
    });
  }

  return items;
}

// listening port
app.listen(process.env.PORT || 3000);