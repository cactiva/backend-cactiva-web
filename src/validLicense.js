const cron = require("node-cron")
const fs = require("fs")
const nodeMailer = require("nodemailer")
const { Clientdb } = require('./db/db')

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth:{
        user:'erlanggadwipratama.if@gmail.com',
        pass: 'capoeirabboy'
    }
})

const mailOptions = (email) => {
    const mail = {
        from: 'erlanggadwipratama.if@gmail.com',
        to: email,
        subject: "It's from Cactiva!",
        text: 'Hi, your status is BASIC now!',
    }
    return mail
}

const validLicense = async (req,res) =>{
    cron.schedule("0 0 * * *", async function(){
        const license = await Clientdb('Select * from "License"')

        const dateNow = new Date()
        let i = 0
        let j = 0
        while(i <= license.rowsCount ){
            const idLicense = license.rows[i].id
            const idUser = license.rows[i].userprofile_id
            const userProfile = await Clientdb.query('Select * from "UserProfile" where id = $1',[idUser])
            const emailUser = userProfile.rows[0].email
            //const type = license.rows[i].type
            const status = license.rows[i].status
            const valid = license.rows[i].valid_to
            const validto = new Date(valid)
            if(dateNow.getDate() + 1 > validto.getDate()){
                    if(status === 'ACTIVE'){
                        await Clientdb.query('UPDATE "License" Set "status" = $1 where id = $2',['EXPIRED', idLicense])
                        const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['BASIC',''])
                        const idtype = inputType.rows[0].id
                        await Clientdb.query('Insert into "License"("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ dateNow.getDate(), '', 'ACTIVE','BASIC', idUser, idtype, ''])
                        transporter.sendMail(mailOptions(emailUser))
                    }else if(status === 'PENDING'){
                        await Clientdb.query('UPDATE "License" Set "status" = $1 where id = $2',['ACTIVE', idLicense])
                    }
            }
        }
    })
}

module.exports = { validLicense }