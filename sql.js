const mysql = require('mysql')
const express=  require('express')
const fs = require('fs')
const multer = require('multer')
const app = express()
const {uploadFile, getFileStream, deleteFile } = require('./s3.js')
const multerS3 = require('multer-s3');
const data = fs.readFileSync('./database.json')
const conf = JSON.parse(data)
const bodyparser = require('body-parser')

const PORT = 3000 || process.env.PORT
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))

app.set('view engine', 'ejs'); 
app.engine('html', require('ejs').renderFile);

const aws = require('aws-sdk');
const s3 = new aws.S3()
const upload = multer({
    dest: "logo"
});


const db = mysql.createConnection({
    host: conf.host,
    user : conf.user,
    password: conf.password,
    database : conf.database 
})

db.connect((err)=>{
    if(err)
    throw err;
    console.log("connected")   
})

app.get('', (req,res)=>{
    let sql = "SELECT * FROM POST"
    db.query(sql, (err, result)=>{
        console.log(result)
        res.send(result)
    })
})


app.get('/create', upload.single('logo'), (req,res)=>{
    res.render('create.html')
})

app.post('/add',upload.single("logo"), async(req, res)=>{
    console.log(req.body)
    console.log(req.file)
    console.log(req.body.name)
    let sql = 
    `INSERT INTO POST (name, category, campus, author, logo ) VALUES ("${req.body.name}", "${req.body.category}", "${req.body.campus}", "${req.body.author}", "${req.file.originalname}")`
    const result = await uploadFile(req.file)
    db.query(sql, (err, result)=>{
        if(err)
            throw err;
        console.log(result)
        res.redirect('/')
    })
})

app.get('/add', (req, res)=>{
    let sql = 
    'INSERT INTO POST (name, category, campus, author, logo ) VALUES ("멋사2", "코딩", "명륜", "이영신", "logo.png")'
    db.query(sql, (err, result)=>{
        if(err)
            throw err;
        console.log(result)
        res.send('database added')
    })
})

app.get('/update', (req, res)=>{
    let sql = 
    'UPDATE POST SET name = "멋사3", category = "코딩2", campus = "율전", author = "이영신", logo = "logo2.png" WHERE ID = 1'
    db.query(sql, (err, result)=>{
        if(err)
            throw err;
        console.log(result)
        res.redirect('/')
    })
})

app.get('/delete', async(req, res)=>{
    let sql = 
    'DELETE FROM POST WHERE ID = 16'
    try{
        const result = await deleteFile('KakaoTalk_20210807_184414709.png')
        db.query(sql, (err, result)=>{
            if(err)
                throw err;
            res.render('index.html')
        })
    }
    catch(error)
    {
        console.log(error)
    }
})

app.listen(3000, ()=>{
    console.log("server is on " + PORT)
})