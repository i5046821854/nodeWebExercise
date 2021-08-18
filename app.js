const express=  require('express')

const path = require('path')
const PORT = process.env.PORT || 4000

const app = express()

app.use(express.static(path.join(__dirname, '../public')))
app.get('', (req,res)=>{
    res.send('helloworld')
    }
)
app.listen(PORT, ()=>{
    console.log("server is up", PORT)
})