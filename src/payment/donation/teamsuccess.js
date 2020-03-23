const axios = require('axios')
const { Clientdb } = require('../../db/db')

const getTeamSuccess = async (req, res) =>{
    const {email1, email2, email3, email4, email5} = req.params

    try{
        const getDataId = await Clientdb.query('SELECT * FROM "UserProfile" where email = $1',[email1])
            
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
                await Clientdb.query('UPDATE "UserProfile" Set "invoice_id" = $1 where "email" = $2',['0', email1])
                insertdatateam(email2, email1, getIdUser, getInvoiceId)
                insertdatateam(email3, email1, getIdUser, getInvoiceId)
                insertdatateam(email4, email1, getIdUser, getInvoiceId)
                insertdatateam(email5, email1, getIdUser, getInvoiceId)
                return res.send('Team License Payment Success, go to your profile page')
            }else if( statuses === "PENDING"){
                return res.send('Payment still Pending')
            }
        })

    }catch(err){
        throw err
    }
}

const insertdatateam = async (email, emailprim, id_referal, inv_id) =>{
    const inputUser = await Clientdb.query('INSERT INTO "UserProfile" ("firstname", "lastname", "email", "password", "gender", "phone", "address", "invoice_id") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *',['', '', email, emailprim, '', '', '','0'])
    const iduserteam = inputUser.rows[0].id
    const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['PRO','Donation, 1 year'])
    const idtype = inputType.rows[0].id 
    const getDateNow = date_ob.toLocaleDateString()
    await Clientdb.query('Insert into "CreateTime" ("create_time", "userprofile_id") values ($1, $2)',['', iduserteam])
    await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ '', '', 'ACTIVE','PRO', iduserteam, idtype, inv_id])
    await Clientdb.query('INSERT INTO "Referal" ("userprofile_id", "referal_user_id", "create_at") VALUES ($1, $2, $3)',[iduserteam, id_referal, getDateNow])
}

module.exports = { getTeamSuccess }
