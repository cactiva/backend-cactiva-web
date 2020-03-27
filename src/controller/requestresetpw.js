const { Clientdb } = require('../db/db')
const jwt = require('jsonwebtoken')
const fastify = require('fastify')()
const nodemailer = require('fastify-nodemailer')

fastify.register(nodemailer, {
    pool: true,
    host: 'smtp.yandex.com',
    port: 465,
    secure: true, // use TLS
    auth: {
      user:'erlangga@cactiva.app',
      pass:'Cactiva123!'
    }
  })

const sendResetPassword = async (req, res, next) => {
    const {email} = req.params

    try{
        const exist = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email])
        if(!exist.rows[0]){
            res.send("Not Exists")
        }
        const iduser = exist.rows[0].id
        const ids = { 
            id: iduser,
            email: email
        }
        const token = jwt.sign(ids, email, {expiresIn: 3600})
        const url = "https://cactiva.netlify.com/form/resetpassword/?id="+iduser+"&token="+token
        fastify.nodemailer.sendMail({
            from: 'Cactiva <erlangga@cactiva.app>',
            to: email,
            subject: "Reset Password Request",
            text: 'Hi, click this link to reset password, the link will expired in 1 hour ' + url,
        }, (err, info) =>{
            if (err){
                next(err)
            }else if(info){
                res.send("Check your email")
            }
        })
    }catch(err){
        res.send(err)
    }
}

module.exports = { sendResetPassword }