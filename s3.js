require('dotenv').config()
const s3 = require('aws-sdk')
const bucketNAme = process.env.AWS_BUCKET_NAME="lee-exercise"
const region = process.env.AWS_BUCKET_REGION=" ap-northeast-2"
const accessKey = process.env.AWS_ACCESS_KEY="AKIA2KZALC67MKBA57G2"
const secretKey = process.env.AWS_SECRET_KEY="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"