const { Clientdb } = require('../db/db')
const {USER_DOESNT_EXISTS} = require('../models/Errors')
const jwt = require('jwt-simple')
const nodeMailer = require("nodemailer")

const transporter = nodeMailer.createTransport({
    host:'smtp.yandex.com',
    port: 465,
    auth:{
        user:'erlangga@cactiva.app',
        pass: 'Cactiva123!'
    },
    secure: true
})

const mailOptions = (email, url) => {
    const mail = {
        from: 'erlangga@cactiva.app',
        to: email,
        subject: "Reset Password Request",
        text: 'Hi, click this link to reset password ' + url,
    }
    return mail
}

const sendResetPassword = async (req, res) => {
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
        const token = jwt.encode(ids, email)
        const url = "https://cactiva.netlify.com/form/resetpassword/?id="+iduser+"&token="+token
        transporter.sendMail(mailOptions(email, url), (err, info) =>{
            if (err) {
                res.send("Error sending email")
              }
              console.log(`** Email sent **`, info)
        })
        res.send("Check your email")
    }catch(err){
        res.send(err)
    }
}

module.exports = { sendResetPassword }