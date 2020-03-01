const { Clientdb } = require('../db/db.js')
const axios = require('axios')
const {INVALID_PASSWORD, USER_DOESNT_EXISTS} = require('../models/Errors')
const userPasswordRegex = '^(?=.{6,})'
const timeStamp = Math.floor(Date.now()/1000)
const bcrypt = require('bcrypt-nodejs')

const postInvoice = async (req, res) => {
    
    const { email, password } = req.body
    const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email])
    
    try{
        
        if(!user.rows[0]){
            res.send(new Error(USER_DOESNT_EXISTS))
        }else{
        
        const checkInvId = user.rows[0].invoice_id
        const pass = user.rows[0].password
        
        if(checkInvId != 0){
            await axios({
                method: 'GET',
                url: 'https://api.xendit.co/v2/invoices/'+checkInvId,
                headers:{ 
                    'cache-contorl': 'no-cache',
                    authorization: 'Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg==',
                }
            }).then(result =>{
                return res.send(result.data.invoice_url)
            })
        }else{
            const isMatch = comparePassword(password, pass)
            if(isMatch){

                await axios({
                    method: 'POST',
                    url: 'https://api.xendit.co/v2/invoices',
                    headers:{ 
                        'cache-control':'no-status',
                        'content-type': 'application/json',
                        authorization: 'Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg==',
                    },
                    data:{
                        external_id: timeStamp.toString(),
                        amount: 700000,
                        payer_email: email,
                        success_redirect_url: 'http://127.0.0.1:3001/invoice/success/'+email,
                        description: 'Activation Code Payment',
                    }
                }).then(async response => {
                    const idInvoice = response.data.id
                    await Clientdb.query('UPDATE "UserProfile" Set "invoice_id" = $1 where email = $2',[idInvoice, email])
                    
                    return res.send(response.data.invoice_url)
                }).catch(err => {
                    return res.send(err.response.data)
                })
            }
        }
            return res.send(new Error(INVALID_PASSWORD))
        }
    
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

const validateInvoice = {
    schema:{
        body:{
            type: 'object',
            properties:{
                email: { type: 'string', format: 'email'},
                password: {type: 'string', format:'regex', pattern: userPasswordRegex},
            },
            required: ['email','password']
        }
    }
}

module.exports = {
    postInvoice, validateInvoice
}