const { Clientdb } = require('../db/db')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const sendResetPassword = async (req, res) => {
    
    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'erlangga@cactiva.app', // generated ethereal user
          pass: 'Cactiva123!' // generated ethereal password
        }
      });

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
        transporter.sendMail({
            from: 'Cactiva <erlangga@cactiva.app>',
            to: email,
            subject: "Reset Password Request",
            text:  'Hi, click this link to reset password, the link will expired in 1 hour ' + url,
        }, (err, info) =>{
            if(err){
                res.send(err)
            }else{
                console.log(info)
                res.send( "Check your email" )
            }
        })
    }catch(err){
        res.send(err)
    }
}

module.exports = { sendResetPassword }