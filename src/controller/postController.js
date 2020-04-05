const bcrypt = require('bcrypt-nodejs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const { Clientdb } = require('../db/db')
const {SignUpResponse} = require('../models/AuthA')
const { checkrowcount } = require('../checkrowcount')
const {INVALID_PASSWORD, USER_DOESNT_EXISTS, USER_EXISTS} = require('../models/Errors')

const postSignup = async (req, res) => {
    const {firstName, lastName,  email, password, gender, phone, address, token, idref} = req.body
    
    let key = ['supersecret', 'mutationkey', 'payday', 'timeclock']

    try{
        const exist = await Clientdb.query('SELECT email FROM "UserProfile" WHERE email = $1',[email])
        
        const existListEmail = exist.rows[0]

        const date_ob = new Date()
        
        const getDateNow = date_ob.toLocaleDateString()
        
        if(existListEmail){
            res.code(400)
            res.send(new Error(USER_EXISTS))
            return
        }
        const tokenPassword = bcrypt.hashSync(password)
        const inputUser = await Clientdb.query('INSERT INTO "UserProfile" ("firstname", "lastname", "email", "password", "gender", "phone", "address", "invoice_id") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *',[firstName, lastName, email, tokenPassword, gender, phone, address,'0'])
        //const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['Trial','7 days'])

        const iduser = inputUser.rows[0].id
        //const idtype = inputType.rows[0].id

        await Clientdb.query('Insert into "CreateTime" ("create_time", "userprofile_id") values ($1, $2)',['', iduser])
        //await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ '', '', 'ACTIVE','PRO-TRIAL', iduser, idtype, ''])
        // if(emailreferal){
        //     const checkId = await Clientdb.query('Select * from "UserProfile" where email = $1',[emailreferal])
        //     if(checkId){
        //      await Clientdb.query('INSERT INTO "Referal" ("userprofile_id", "referal_user_id", "create_at") VALUES ($1, $2, $3)',[parseInt(iduser), parseInt(checkId.rows[0].id), getDateNow])
        //      checkrowcount(checkId.rows[0].id)
        //     }
        // }
        //const tokens = await res.jwtSign({expiresIn: '2d'})
        if(token === ''){
            const ids = {
                id: iduser,
            }
            sendEmail(ids, email, res, iduser)
        }else if(token !== ''){
            let i = 0
            while(i <= 4){
                refLicense(idref, token, iduser, email, getDateNow, key[i])
                i++
            }
        }
        
        
    }catch(err){
        res.send(err)
    }
}

const postLogin = async (req, res) => {
    const {email, password} = req.body
    try{
        const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email])
        const userPass = await Clientdb.query('SELECT password FROM "UserProfile" WHERE email = $1',[email])
        if(!user.rows[0]){
            res.send(new Error(USER_DOESNT_EXISTS))
        }
        const isMatch = await comparePassword(password, userPass.rows[0].password)
        if(isMatch){
            const firstName = user.rows[0].firstname
            const lastName = user.rows[0].lastname
            const gender = user.rows[0].gender
            const phone = user.rows[0].phone
            const address = user.rows[0].address
            const buy_type = user.rows[0].buy_type
            const verified = user.rows[0].verified
            //return login sukses
            //const token = await res.jwtSign({ expiresIn: '2d'})
            return res.send(new SignUpResponse({
                email: email,
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                phone: phone,
                address: address,
                buy_type: buy_type,
                verified: verified
                }))
        }
        return res.send(new Error(INVALID_PASSWORD))
    }catch(err){
        throw err
    }
}

const comparePassword = (candidatePassword, passwordmore) => {
    if(bcrypt.compareSync(candidatePassword,passwordmore)){
        return true
    }else{
        return false
    }
}

const refLicense = async (idref, token, iduser, email, dateNow, secretKey, res) =>{

    if(idref !== ''){
        if(token !== ''){
            const payload = jwt.verify(token, secretKey)
            if(payload.id){
                const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE id = $1',[idref])
                if(!user.rows[0]){
                    res.send('User not exist')
                }
                if(payload.id === idref ){
                    //const types = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['PRO','1 year'])
                    //await Clientdb.query('Insert into "License" ("valid_from", "status", "type", "userprofile_id", "typelicense_id", "invoice_id", "valid_to") values ($1, $2, $3, $4, $5, $6, $7)', [ '', 'PENDING', 'PRO', iduser, types.rows[0].id, payload.invoice_id,''])
                    //await Clientdb.query('INSERT INTO "Referal" ("userprofile_id", "referal_user_id", "create_at") VALUES ($1, $2, $3)',[iduser, idref, dateNow])
                    const ids = {
                        id: iduser,
                        id_ref: idref,
                        invoice: payload.invoice_id,
                        datenow: dateNow
                    }
                    sendEmail(ids, email, res, iduser)
                }else if(payload.id !== idref){
                    res.send('Something wrong')
                }
            }
        }
    }
}

const sendEmail = async (ids, email, res, iduser) =>{
    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.com",
        port: 465,
        secure: true, 
        auth: {
          user: 'erlangga@cactiva.app', 
          pass: 'Cactiva123!' 
        }
      });

    const tokenverified = jwt.sign(ids, email)
        const url = "http://cactiva.netlify.com/form/verify/?id="+iduser+"&token="+tokenverified
        transporter.sendMail({
            from: 'Cactiva <erlangga@cactiva.app>',
            to: email,
            subject: "Email Verification",
            text:  "Hi, click this link for verification, don't give it to anyone " + url
        }, (err, info) =>{
            if(err){
                console.log(err)
                res.send(err)
            }else{
                console.log(info)
                res.send(new SignUpResponse({
                    message: 'Check your email',
                    token: tokenverified
                }))
            }
        })
}

module.exports = {
    postLogin,
    postSignup,
    comparePassword
}