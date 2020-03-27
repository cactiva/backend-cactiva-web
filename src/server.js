const Fastify = require('fastify')
const uuid = require('uuid/v4')
const jwt = require('fastify-jwt')
const { validatePostLogin, validatePostSignup } = require('./models/auth')
const { postLogin, postSignup } = require('./controller/postController')
const { validateInvoice, postInvoice} = require('./payment/invoices')
const {getSuccess} = require('./payment/succees')
const { validLicense } = require('./validLicense')
const {Clientdb} = require('./db/db')
const {userController} = require("./controller/userController")
const {getTeamSuccess} = require("./payment/donation/teamsuccess")
const {getTeamInvoice} = require("./payment/donation/teaminvoice")
const {sendResetPassword} = require("./controller/requestresetpw")
const {getNewPassword} = require("./controller/newpassword")
// const {checkrowcount}= require('./controller/checkrowcount')
// const {refPay} = requir e('./payment/refPay')

const createRequestId = () => uuid();

Clientdb.connect();

const server = Fastify({
  ignoreTrailingSlash: true,
  genReqId: createRequestId,
  logger: {
    level: "info"
  }
});

server.register(jwt, {
  secret: "supersecret"
});

server.register(require("fastify-cors"), {
  origin: "*"
});

server.register(require('fastify-nodemailer'), {
  pool: true,
  host: 'smtp.yandex.com',
  port: 465,
  secure: true, // use TLS
  auth: {
    user:'erlangga@cactiva.app',
    pass: 'Cactiva123!'
  }
})
//API buat Login POST
server.post("/auth/login/", validatePostLogin, postLogin);

//API buat Signup POST
server.post("/auth/signup/", validatePostSignup, postSignup);

//API buat invoice Pembayaran POST
server.post("/invoices/", validateInvoice, postInvoice);
server.post("/invoices/teaminvoice/", getTeamInvoice);

server.post("/checkpayment/", userController);

//API buat Pembayaran sukses GET PARAMs
server.get("/invoice/success/:emailUser", getSuccess);
server.get(
  "/invoice/teamsuccess/:email1/:email2/:email3/:email4/:email5",
  getTeamSuccess
);

server.get("/resetpw/user/:email", sendResetPassword);
server.post("/newpw/", getNewPassword);

    //tes fun api
    //server.get('/tes/:tes', refPay)
    
    server.listen(10000, '0.0.0.0',(err) => {
        if(err){
            server.log.error(err)
            console.log(err)
            process.exit(1)
        }
        server.log.info('Server Started')
    })
