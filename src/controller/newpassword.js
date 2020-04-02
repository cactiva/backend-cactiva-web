const { Clientdb } = require('../db/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt-nodejs')

const getNewPassword = async (req, res) =>{
    const {userId, token, password} = req.body

    try{
        const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE id = $1',[userId])
        let payload = jwt.verify(token, user.rows[0].email)

        if(!user.rows[0]){
            res.send('User not exist')
        }
        if(payload.id === userId ){
            const tokenPassword = bcrypt.hashSync(password)
            await Clientdb.query('Update "UserProfile" set "password" = $1 where "id" = $2', [tokenPassword, userId])
            res.send('Login with new password')
        }else{
            res.send('Something wrong')
        }
    }catch(err){
        res.send(err)
    }
}

module.exports = {getNewPassword}