const mysql = require('mysql2')
const express = require('express')
const app = express()
const bcrypt = require('bcrypt');
const fs = require('fs')
const multer = require('multer')
const multerS3 = require('multer-s3');
const cookieParser = require('cookie-parser')
const url = require('url');
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
const { uploadFile, getFileStream, deleteFile } = require('./s3.js')
const data = fs.readFileSync('./database.json')
const conf = JSON.parse(data)
const path = require('path')

// const bodyparser = require('body-parser')
// app.use(bodyparser.json())
// app.use(bodyparser.urlencoded({ extended: false }))

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status()
    }
}
app.set("view engine", "ejs");

// "ejs"로 변경 후 "html" 파일로 열 수 있게 렌더링
//app.engine("html", require("ejs").renderFile);

const PORT = 3000 || process.env.PORT


app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

const Dirpath = path.join(__filename, "../")
app.use(express.static(Dirpath))
app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);

const aws = require('aws-sdk');
const { CloudFront } = require('aws-sdk');
const { networkInterfaces } = require('os');
const s3 = new aws.S3()



const upload = multer({
    dest: "logo"
});


const db = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    database: conf.database
})


const auth = function(req, res, next) {
    if (!req.session.user)
        res.send("<script>alert('로그인 후 이용가능합니다');window.location.href='/login';</script>")
    else
        next();
}

const authAdmin = function(req, res, next) {
    if (req.session.user.authority <= 3)
        res.send(`res.send("<script>alert('접근 권한이 없습니다');window.location.href="javascript:window.history.back();";</script>")`);
    else
        next();
}

db.connect((err) => {
    if (err)
        throw err;
    console.log("connected")
})

//var sessionStore = new MySQLStore(db);

app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
    })
)

// app.get('', (req, res) => {
//     let sql = "SELECT * FROM CLUBLIST"
//     db.query(sql, (err, result) => {
//         res.render("index.ejs", {
//             result: JSON.parse(JSON.stringify(result)),
//             bucket: process.env.AWS_BUCKET_NAME,
//             region: process.env.AWS_BUCKET_REGION

//         })
//     })
// })

app.get('', (req, res) => {
    if (req.session.user)
        res.redirect("/getOne")
    else
        res.redirect("/login")
})


app.get('/changePWD', auth, (req, res) => {
    res.render('changePWD.ejs', {
        pwd: req.session.user.admin_pw
    });
})

app.post('/changePWD', (req, res) => {
    const pwd = req.body.pwd1
    bcrypt.genSalt(10, function(err, salt) {
        if (err)
            res.send("<script>alert('에러발생1');window.location.href='/changePWD';</script>")
        bcrypt.hash(pwd, salt, function(err, hashedPWD) {
            if (err) {
                res.send("<script>alert('에러발생2');window.location.href='/changePWD';</script>")
            }
            let sql = `update CLUB_OLD set admin_pw = "${hashedPWD}" WHERE cid = ${req.session.user.cid}`
            db.query(sql, async(err, result) => {
                if (err)
                    req.session.user = undefined
                res.send("<script>alert(`성공적으로 변경되었습니다.\n다시 로그인 해주세요`);window.location.href='/login';</script>")
            })
        })
    })
})

async function copy() {
    let sql = "SELECT * FROM POST"
    return db.query(sql, (err, result) => {
        skkclub = JSON.stringify(result)
        console.log(skkclub + "최고")
    })
}

app.get('/create', upload.single('logo'), (req, res) => {
    res.render('create.ejs')
})

app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.get('/logout', (req, res) => {
    req.session.user = undefined;
    res.send("<script>alert(`로그아웃되었습니다.\n다시 로그인 해주세요`);window.location.href='/login';</script>")
})

const login = async function(id, pw) {
    let result2 = "";
    let sql =
        `select * from CLUB_OLD where admin_id = "${id}"`
    const result = await db.promise().query(sql)
    const textRow = JSON.parse(JSON.stringify(result[0]))
    if (!textRow[0]) {
        result2 = "No id"
    } else {
        const isMatch = await bcrypt.compare(pw, textRow[0].admin_pw);
        if (isMatch)
            result2 = textRow[0];
        else
            result2 = "invalid password"
    }
    return new Promise((resolve, reject) => {
        resolve(result2)
    })
}

app.post('/login', async(req, res) => {
    var id = req.body.id;
    var pw = req.body.pwd;
    const result = await login(id, pw);
    if (result.cid) {
        req.session.user = result
        res.cookie('cnt', 0)
        if (result.authority <= 3) {
            res.redirect("/getOne")
                // res.redirect(url.format({
                //     pathname: "/getOne",
                //     query: result
                // }))
        } else {
            res.redirect('/getAll')
        }
        //res.redirect('/getAll')
    } else {
        if (!req.cookies.cnt) {
            res.cookie('cnt', 1);
        } else {
            res.cookie('cnt', Number(req.cookies.cnt) + 1)
        }
        res.send(`<script> alert("그런 계정은 없습니다"); window.location.href='/login'; </script>`)
    }
})

app.get('/getOne', auth, (req, res) => {
    let sql = `select * from CLUB_OLD WHERE cid = ${req.session.user.cid}`
    db.query(sql, async(err, result) => {
        if (err)
            console.log(err);
        req.session.user = result[0]
        res.render('data.ejs', {
            data: JSON.parse(JSON.stringify(result[0]))
        })
    })
})

app.get('/updateData', auth, (req, res) => {
    res.render('data2.ejs', {
            data: JSON.parse(JSON.stringify(req.session.user))
        })
        // let sql = `select * from CLUB_OLD WHERE cid = ${req.session.user.cid}`
        // db.query(sql, async(err, result) => {
        //     if (err)
        //         console.log(err);
        //     res.render('data2.ejs', {
        //         data: JSON.parse(JSON.stringify(result[0]))
        //     })
        // })
})

app.post('/updateData', (req, res) => {
    const data = req.body
    let sql = `update CLUB_OLD SET cname = "${data.cname}", category1= "${data.category1}", category2 = "${data.category2}", category3 = "${data.category3}", campus = "${data.campus}", estab_year = "${data.estab_year}",intro_text = "${data.intro_text}", intro_sentence = "${data.intro_sentence}", activity_info = "${data.activity_info}", meeting_time = "${data.meeting_time}", activity_location = "${data.activity_location}", activity_num = "${data.acticity_num}", recruit_season = "${data.recruit_season}", activity_period = "${data.activity_period}", recruit_process = "${data.recruit_process}", recruit_num = "${data.recruit_num}", recruit_site = "${data.recruit_site}", president_name = "${data.president_name}", president_contact = "${data.president_contact}", emergency_contact = "${data.emergency_contact}", website_link = "${data.website_link}", website_link2 = "${data.website_link2}"  WHERE cid = ${data.cid} `
    db.query(sql, async(err, result) => {
        if (err)
            console.log(err);
        res.redirect('/getOne')
    })
})


app.get('/getAll', auth, authAdmin, (req, res) => {
    res.render('dataTable.ejs')
})

app.post('/add', upload.single("logo"), async(req, res) => {
    let sql =
        `INSERT INTO POST (name, category, campus, author, logo ) VALUES ("${req.body.name}", "${req.body.category}", "${req.body.campus}", "${req.body.author}", "${req.file.originalname}")`
    const result2 = await uploadFile(req.file)
    db.query(sql, async(err, result) => {
        if (err)
            throw err;
        res.redirect('/')
    })
})


app.get('/update', async(req, res) => {
    /*const club = skkclub.forEach(each=>{
        return each.id == req.query.id
    })*/
    res.render("update.ejs", {

    })
})

app.get('/another', (req, res) => {
    let sql = "INSERT INTO CLUBLIST (campus, korName, engName, cnName, DIV1, DIV2, DIV3,logo,est,representative,repContact,emerCont, website1, website2,blocked, blockEU,auth) VALUES ('명륜','중앙동아리','','','중앙동아리','평면예술','서예', 'https://admin.skklub.com/img/logo/69.jpg','1963','조윤서','	01075596189','','https://www.instagram.com/skku.seodo','',1,'', 3)"
    db.query(sql, async(err, result) => {
        if (err)
            throw err;
        res.send('good')
    })
})

app.get('/getOld', (req, res) => {
    let sql = "SELECT a.* ,b.share ,b.upt FROM CLUB_OLD AS a INNER JOIN SHARE AS b ON a.cid = b.cid"
    db.query(sql, async(err, data) => {
        if (err)
            throw err;
        res.send((JSON.stringify(data)))
    })
})


app.post('/update', upload.single("logo"), async(req, res) => {
    id = Number(req.body.id)
    let sql =
        `UPDATE POST SET name = "${req.body.name}", category = "${req.body.category}", campus = "${req.body.campus}", author = "${req.body.author}", logo = "${req.file.originalname}" WHERE ID = ${id}`
    const result = await uploadFile(req.file)
    db.query(sql, (err, result) => {
        if (err)
            throw err;
        res.redirect('/')
    })
})

app.post('/updated', (req, res) => {
    if (req.body.updatedData !== undefined) {
        req.body.updatedData.forEach((e) => {
            let sql =
                `UPDATE SHARE SET upt = 1 WHERE CID = "${Number(e)}"`
            db.query(sql, async(err, result) => {
                if (err)
                    throw err;
            })
        })
    }
    if (req.body.sharedData !== undefined) {
        req.body.sharedData.forEach((e) => {
            let sql =
                `UPDATE SHARE SET share = 1 WHERE CID = "${Number(e)}"`
            db.query(sql, async(err, result) => {
                if (err)
                    throw err;
            })
        })
    }
    if (req.body.unupdatedData !== undefined) {
        req.body.unupdatedData.forEach((e) => {
            let sql =
                `UPDATE SHARE SET upt = 0 WHERE CID = "${Number(e)}"`
            db.query(sql, async(err, result) => {
                if (err)
                    throw err;
            })
        })
    }
    if (req.body.unsharedData !== undefined) {
        req.body.unsharedData.forEach((e) => {
            let sql =
                `UPDATE SHARE SET share = 0 WHERE CID = "${Number(e)}"`
            db.query(sql, async(err, result) => {
                if (err)
                    throw err;
            })
        })
    }
})

app.get('/delete', async(req, res) => {
    id = req.query.id
    let sql =
        `DELETE FROM POST WHERE ID = ${id}`
    try {
        //const result = await deleteFile('KakaoTalk_20210807_184414709.png')
        db.query(sql, (err, result) => {
            if (err)
                throw err;
            res.redirect('/')
        })
    } catch (error) {
        console.log(error)
    }
})

app.listen(3000, () => {
    console.log("server is on " + PORT)
})