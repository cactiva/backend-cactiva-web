const { Clientdb } = require('../db/db')
const {SignUpResponse} = require('../models/AuthA')

const getUpdate = async (req, res) =>{
    const {firstName, lastName,  gender, phone, address, email} = req.body

    try{
        const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email])
        if(!user.rows[0]){
            res.send(new Error(USER_DOESNT_EXISTS))
        }else{
            const buytype = user.rows[0].buy_type
            await Clientdb.query('UPDATE "UserProfile" Set "firstname" = $1, "lastname" = $2, "gender" = $3, "phone" = $4, "address" = $5  where "email" = $6',[firstName, lastName, gender, phone, address, email])
            res.send(new SignUpResponse({
                email: email, 
                firstName: firstName, 
                lastName: lastName, 
                gender: gender,
                phone: phone,
                address: address,
                buy_type: buytype}))
        }
    }catch(err){
        res.send(err)
    }
}

module.exports = { getUpdate }