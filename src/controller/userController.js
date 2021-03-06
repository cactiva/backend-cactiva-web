const { Clientdb } = require('../db/db.js')
const axios = require('axios')

const userController = async (req, res) =>{
    const {email} = req.body

    try{
        const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email])
        const iduser = user.rows[0].id
        let inv = user.rows[0].invoice_id

        const license = await Clientdb.query('SELECT * FROM "License" WHERE userprofile_id = $1',[iduser])
        const lastrow = license.rowCount - 1
        const checkLastLicense = license.rows[lastrow].type
        if(checkLastLicense === "PRO" ){
            inv = license.rows[lastrow].invoice_id
            check(inv, res)
        }else if(checkLastLicense === "PRO-TRIAL"){
            if(inv != 0){
                check(inv, res)
            }else{
                return res.send("UNPAID")
            }
        }else{
            return res.send("UNPAID")
        }
    }catch(err){
        return res.send(err)
    }
}

const check = async (inv, res) =>{
    await axios({
        method: 'GET',
        url: 'https://api.xendit.co/v2/invoices/'+inv,
        headers:{ 
            'cache-contorl': 'no-cache',
            authorization: 'Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg==',
        }
    }).then(result => {
        return res.send(result.data)
    })
}

module.exports = { userController }