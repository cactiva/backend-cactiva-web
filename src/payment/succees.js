
//const {SignUpResponse} = require('../models/AuthA')
const axios = require('axios')
const { Clientdb } = require('../db/db')
const jwt = require('jsonwebtoken')
// const { refPay } = require('../refPay')

const getSuccess = async (req, res) => {
    const  {emailUser, buytype}  = req.params
    
    try{
        
        const getDataId = await Clientdb.query('SELECT * FROM "UserProfile" where email = $1',[emailUser])
        
        const getInvoiceId = getDataId.rows[0].invoice_id
        const getIdUser = getDataId.rows[0].id
        
        // let lastrowlicense = ''
        // let statustype = 'EXPIRED'
        // const requiredLicense = await Clientdb.query('Select * from "License" where userprofile_id = $1',[getIdUser])
        // if(requiredLicense){
        //     lastrowlicense = requiredLicense.rowCount - 1
        //     statustype = requiredLicense.rows[lastrowlicense].status
        // }
        
        // let stat = ''

        // if(statustype === 'ACTIVE'){
        //     stat = 'PENDING'
        // }else if(statustype === 'PENDING'){
        //     stat = 'PENDING'
        // }else if(statustype === 'EXPIRED'){
        //     stat = 'ACTIVE'
        // }
        
        if(getInvoiceId === 0){
            return res.send('Payment Success')
        }
        
        // //Check Status Pembayaran
        await axios({
            method: 'GET',
            url: 'https://api.xendit.co/v2/invoices/'+getInvoiceId,
            headers:{ 
                'cache-control':'no-cahce',
                authorization: 'Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg==',
            }
        }).then(async result =>{
            const statuses = result.data.status
            if( statuses === "SETTLED" || statuses === "PAID"){
                const types = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['PRO','1 year'])
                await Clientdb.query('Insert into "License" ("valid_from", "status", "type", "userprofile_id", "typelicense_id", "invoice_id", "valid_to") values ($1, $2, $3, $4, $5, $6, $7)', [ '', 'PENDING', 'PRO', getIdUser, types.rows[0].id, getInvoiceId,''])
                await Clientdb.query('UPDATE "UserProfile" Set "invoice_id" = $1, "buy_type" = $2 where "email" = $3',['0', buytype, emailUser])
                if(buytype === 'team'){
                    linkreferal(getIdUser, getInvoiceId, 'supersecret')
                    linkreferal(getIdUser, getInvoiceId, 'mutationkey')
                    linkreferal(getIdUser, getInvoiceId, 'payday')
                    linkreferal(getIdUser, getInvoiceId, 'timeclock')
                    sendEmail(getIdUser)
                }
                // const referal = await Clientdb.query('SELECT * FROM "Referal" WHERE userprofile_id = $1',[getIdUser])
                // if(referal){
                //     refPay(getIdUser)
                // }
                return res.send("https://cactiva.netlify.com/profile/")
            }else if( statuses === "PENDING"){
                return res.send('Payment still Pending')
            }
        })

    }catch(err){
        throw err
    }
}

const linkreferal = async (id, inv, secretKey) =>{
    const ids ={
        id: id,
        invoice_id: inv
    }
    const token = jwt.sign(ids, secretKey, {mutatePayload: true})
    const url = "https://cactiva.netlify.com/form/?id="+id+"&token="+token
    await Clientdb.query('INSERT into "LinkReferal"("userprofile_id", "link") values($1, $2)',[id, url])
}

const sendEmail = async (id) =>{
    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.com",
        port: 465,
        secure: true, 
        auth: {
          user: 'erlangga@cactiva.app', 
          pass: 'Cactiva123!' 
        }
      });

        const linkreferal = await Clientdb.query('Select * from "LinkReferal" where "userprofile_id" = $1',[id])
        let list = linkreferal.rowCount - 1
        transporter.sendMail({
            from: 'Cactiva <erlangga@cactiva.app>',
            to: email,
            subject: "Payment Success for Team License ",
            text:  "Thanks for your support, send this link to your partner and register from it. Remember, one link for one user. \n 2nd user: " + linkreferal.rows[list].link +"\n 3rd user: "+ linkreferal.rows[list-1].link +"\n 4th user :"+ linkreferal.rows[list-2].link +"\n 5th user:"+ linkreferal.rows[list-3].link
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
    getSuccess
}
