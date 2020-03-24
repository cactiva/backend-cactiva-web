
const {SignUpResponse} = require('../models/AuthA')
const axios = require('axios')
const { Clientdb } = require('../db/db')
const { refPay } = require('../refPay')

const getSuccess = async (req, res) => {
    const  {emailUser}  = req.params
    
    try{
        //Get Id Invoice dari MongoDB
        
        const getDataId = await Clientdb.query('SELECT * FROM "UserProfile" where email = $1',[emailUser])
        
        const getInvoiceId = getDataId.rows[0].invoice_id
        const getIdUser = getDataId.rows[0].id

        const requiredLicense = await Clientdb.query('Select * from "License" where userprofile_id = $1',[getIdUser])
        const lastrowlicense = requiredLicense.rowCount - 1
        const getDeadLine = requiredLicense.rows[lastrowlicense].valid_to
        const statustype = requiredLicense.rows[lastrowlicense].status
        let stat = ''
        let getDateNow = ''
        let setDateThen = ''

        if(getDeadLine){
                const d = new Date(getDeadLine)
                d.setDate(d.getDate()+1)
                getDateNow = d.toLocaleDateString()
                d.setDate(d.getDate()+364)
                setDateThen = d.toLocaleDateString()
        }else{
            const d = new Date()
            d.setDate(d.getDate())
            getDateNow = d.toLocaleDateString()
            d.setDate(d.getDate()+365)
            setDateThen = d.toLocaleDateString()
        }

        if(statustype === 'ACTIVE'){
            stat = 'PENDING'
        }else if(statustype === 'PENDING'){
            stat = 'PENDING'
        }else if(statustype === 'EXPIRED'){
            stat = 'ACTIVE'
        }
        
        if(getInvoiceId === ''){
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
                await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ '', '', stat,'PRO', getIdUser, types.rows[0].id, getInvoiceId])
                await Clientdb.query('UPDATE "UserProfile" Set "invoice_id" = $1 where "email" = $2',['0', emailUser])
                const referal = await Clientdb.query('SELECT * FROM "Referal" WHERE userprofile_id = $1',[getIdUser])
                if(referal){
                    refPay(getIdUser)
                }
                return res.redirect("https://cactiva.netlify.com/profile/")
            }else if( statuses === "PENDING"){
                return res.send('Payment still Pending')
            }
        })

    }catch(err){
        throw err
    }
}

module.exports = {
    getSuccess
}
