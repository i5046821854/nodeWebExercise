const express=  require('express')
const AWS = require('aws-sdk')
const path = require('path')
const PORT = process.env.PORT || 4000
AWS.config.region = 'ap-northeast-2'
const app = express()

app.use(express.static(path.join(__dirname, '../public')))
app.get('', (req,res)=>{
    res.send('helloworld')
    }
)
app.listen(PORT, ()=>{
    console.log("server is up", PORT)
})