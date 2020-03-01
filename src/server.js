const Fastify = require('fastify')
const uuid = require('uuid/v4')
const jwt = require('fastify-jwt')
const { validatePostLogin, validatePostSignup } = require('./models/auth')
const { postLogin, postSignup } = require('./controller/postController')
const { validateInvoice, postInvoice} = require('./payment/invoices')
const {getSuccess} = require('./payment/succees')
//const { validLicense } = require('./validationLicense')
const {Clientdb} = require('./db/db')
// const {checkrowcount} = require('./controller/checkrowcount')
// const {refPay} = require('./payment/refPay')

const createRequestId = () => uuid()

Clientdb.connect();

const server = Fastify({
        ignoreTrailingSlash:true,
        genReqId: createRequestId,
        logger:{
            level: 'info'
        }
    })
    
    server.register(jwt,{
        secret: "supersecret"
    })

    //API buat Login POST
    server.post('/auth/login/', validatePostLogin, postLogin)

    //API buat Signup POST
    server.post('/auth/signup/', validatePostSignup, postSignup)

    // //API buat Signup dengan referal POST
    // server.post('/auth/signup/:emailreferal',validatePostSignup, postSignup)

    //API buat invoice Pembayaran POST
    server.post('/invoices/',validateInvoice, postInvoice)

    //API buat Pembayaran sukses GET PARAMs
    server.get('/invoice/success/:emailUser', getSuccess)

    //Jalanin Cron Job
    //server.get('/valid',validLicense)

    //tes fun api
    //server.get('/tes/:tes', refPay)
    
    server.listen(3001, (err) => {
        if(err){
            server.log.error(err)
            console.log(err)
            process.exit(1)
        }
        server.log.info('Server Started')
    })
