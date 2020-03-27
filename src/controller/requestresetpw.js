const { Clientdb } = require('../db/db')
const jwt = require('jsonwebtoken')
const fastify = require('fastify')()

const mailOptions = (email, url) => {
    const mail = {
        from: 'Cactiva <erlangga@cactiva.app>',
        to: email,
        subject: "Reset Password Request",
        text: 'Hi, click this link to reset password, the link will expired in 1 hour ' + url,
    }
    return mail
}

const sendResetPassword = async (req, res, next) => {
    
    fastify.register(require('fastify-nodemailer'), {
        pool: true,
        host: 'smtp.yandex.com',
        port: 465,
        secure: true, // use TLS
        auth: {
          user:'erlangga@cactiva.app',
          pass: 'Cactiva123!'
        }
      })
    
    const { nodemailer } = fastify
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
        fastify.nodemailer.sendMail(mailOptions(email, url), (err, info) =>{
            if (err){
                next(err)
            }
            res.send("Check your email")
        })
    }catch(err){
        res.send(err)
    }
}

module.exports = { sendResetPassword }