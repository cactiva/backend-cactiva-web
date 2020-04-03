const { Clientdb } = require('../db/db')
const jwt = require('jsonwebtoken')
const {comparePassword} = require("./postController")
const {SignUpResponse} = require('../models/AuthA')

const getVerified = async (req, res) =>{
    const {id, token, email, password} = req.body
    try{
        const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE id = $1',[id])
        let payload = jwt.verify(token, user.rows[0].email)
        if(!user.rows[0]){
            res.send('User not exist')
        }
        if(payload.id === id ){
            const isMatch = comparePassword(password, user.rows[0].password)
            if(isMatch){
                const userupdate = await Clientdb.query('UPDATE "UserProfile" Set "verified" = $1 where "email" = $2 returning *' ,['verified', email])
                const firstName = user.rows[0].firstname
                const lastName = user.rows[0].lastname
                const gender = user.rows[0].gender
                const phone = user.rows[0].phone
                const address = user.rows[0].address
                const buy_type = user.rows[0].buy_type
                const verified = userupdate.rows[0].verified
                
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
        }else{
            res.send(new SignUpResponse({
                message: 'Something Wrong',
                id: payload.id}))
        }
    }catch(err){
        res.send(err)
    }
}

module.exports = { getVerified }