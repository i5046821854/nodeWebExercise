const mysql = require('mysql')
const express=  require('express')
const fs = require('fs')

const app = express()
const data = fs.readFileSync('./database.json')
const conf = JSON.parse(data)

const PORT = 3000 || process.env.PORT

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
        res.send(result)
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
        res.send('database updated')
    })
})

app.get('/delete', (req, res)=>{
    let sql = 
    'DELETE FROM POST WHERE ID = 3'
    db.query(sql, (err, result)=>{
        if(err)
            throw err;
        console.log(result)
        res.send('database deleted')
    })
})

app.listen(3000, ()=>{
    console.log("server is on " + PORT)
})