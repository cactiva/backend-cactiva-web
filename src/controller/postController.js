const bcrypt = require('bcrypt-nodejs')

const { Clientdb } = require('../db/db')
const {SignUpResponse} = require('../models/AuthA')
const { checkrowcount } = require('../checkrowcount')
const {INVALID_PASSWORD, USER_DOESNT_EXISTS, USER_EXISTS} = require('../models/Errors')

const postSignup = async (req, res) => {
    const {firstName, lastName,  email, password, gender, phone, address, emailreferal} = req.body
    
    try{
        const exist = await Clientdb.query('SELECT email FROM "UserProfile" WHERE email = $1',[email])
        
        const existListEmail = exist.rows[0]

        const date_ob = new Date()
        
        const getDateNow = date_ob.toLocaleDateString()
        date_ob.setDate(date_ob.getDate() + 7)
        const setDateThen = date_ob.toLocaleDateString()
        
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
        if(emailreferal){
            const checkId = await Clientdb.query('Select * from "UserProfile" where email = $1',[emailreferal])
            if(checkId){
             await Clientdb.query('INSERT INTO "Referal" ("userprofile_id", "referal_user_id", "create_at") VALUES ($1, $2, $3)',[parseInt(iduser), parseInt(checkId.rows[0].id), getDateNow])
             checkrowcount(checkId.rows[0].id)
            }
        }
        const token = await res.jwtSign({expiresIn: '2d'})
        res.send(new SignUpResponse({email: email, 
            token, 
            firstName: firstName, 
            lastName: lastName, 
            gender: gender,
            phone: phone,
            address: address}))
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
            //return login sukses
            const token = await res.jwtSign({ expiresIn: '2d'})
            return res.send(new SignUpResponse({
                email: email,
                token,
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                phone: phone,
                address: address}))
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


module.exports = {
    postLogin,
    postSignup
}