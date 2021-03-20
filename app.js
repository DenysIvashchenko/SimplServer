const http = require('http');
const fs = require('fs');
const path = require('path');

const db = require('./db');
const Image = db.image;

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    console.log(`req: ${req.url}`);
    if (req.url === '/') {
        sendRes('index.html', 'text/html', res);

    }
    else if (/\/uploads\/[^\/]+$/.test(req.url) && req.method === 'POST') {
        console.log('upload file');
        saveUploadFile(req, res);

    } else if (req.url === '/save-form') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log(body);
            writeToDb(body, res);
        });
    }
    else {
        sendRes(req.url, getContentType(req.url), res);
    }

}).listen(3000, () => {
    console.log('server work 3000');
});

//Send resurse
function sendRes(url, contentType, res) {
    let file = path.join(__dirname + '/static/', url);
    fs.readFile(file, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.write('file not found');
            res.end();
            console.log(`error 404 ${file}`);
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content);
            res.end();
            console.log(`status 200 ${file}`);
        }
    })
}

//Content Type
function getContentType(url) {
    switch (path.extname(url)) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        case '.json':
            return 'application/json';
        default:
            return 'application/octate-stream';
    }
}

//save file
function saveUploadFile(req, res) {
    let fileName = path.basename(req.url);
    let file = path.join(__dirname, 'uploads', fileName);
    let imageFolder = path.join(__dirname, 'static/images', fileName);
    console.log("==========")
    console.log(fileName)
    console.log('++++++++++')
    console.log(file)
    console.log('-----------')
    console.log(imageFolder)
    console.log('--------')

    req.pipe(fs.createWriteStream(file));
    req.on('end', () => {
        fs.copyFile(file, imageFolder, err => {
            if (err) {
                console.log(err)
            }
            fs.unlink(file, err => {
                if (err) {
                    console.log(err);
                }
            });
        });
        res.writeHead(200, { 'Content-Type': 'text' });
        res.write(fileName);
        res.end();
    });
}

//save to db
function writeToDb(data, res) {
    data = JSON.parse(data, true);
    console.log(data);
    Image.create({
        image_name: data['input-1'],
        file_name: data['input-2'],
        user_name: data['input-3'],
    })
        .then(result => {
            console.log(result);
            res.end('ok')
        })
        .catch(err => {
            console.log(err);
            res.end('error');
        })
}
