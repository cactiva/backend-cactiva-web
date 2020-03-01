const { Clientdb } = require('../db/db.js')
const axios = require('axios')

const checkrowcount = async(id) =>{
    const userData = await Clientdb.query('SELECT * FROM "License" WHERE userprofile_id = $1',[id])
    const createTime = await Clientdb.query('SELECT * FROM "CreateTime" WHERE userprofile_id = $1',[id])
    const referal = await Clientdb.query('SELECT * FROM "Referal" WHERE referal_user_id = $1',[id])
    const lastrow = userData.rowCount - 1
    const status = userData.rows[lastrow].status //Active or Pending
    const type = userData.rows[lastrow].type //Basic or Pro
    const from  = userData.rows[lastrow].valid_from
    const valid = userData.rows[lastrow].valid_to
    const getCreateTime = createTime.row[0].create_time

    const dateNow = new Date()
    const getDateNow = dateNow.toLocaleDateString()

    const validto = new Date(valid)
    const validfrom = new Date(from)

    let ref = []
    
    if(getCreateTime){
        await Clientdb.query('UPDATE "CreateTime" Set "create_time" = $1 where userprofile_id = $2',[getDateNow, id])
    }

    let i = 0
    let j = 0
    while(i < referal.rowCount){
        const getRef = referal.rows[i].create_at
        if( +getRef.getDate() >= +getDateNow.getDate()){
            ref.push(getRef)
        }
    }

    if(ref === 10){
        if(type === 'BASIC'){
            validto.setDate(validto.getDate() + 30)
            const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['Trial','30 days'])
            const idtype = inputType.rows[0].id
            await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ getDateNow, validto.toLocaleDateString(), 'ACTIVE','PRO-TRIAL', id, idtype, ''])
        }else if (type === 'PRO'){
            validto.setDate(validto.getDate() + 7)
            await Clientdb.query('UPDATE "License" Set "valid_to" = $1 where userprofile_id = $2',[validto.toLocaleDateString(), id])
        }else if (type === 'PRO-TRIAL'){
            if(status === 'ACTIVE'){
                validto.setDate(validto.getDate() + 30)
                validfrom.setDate(validfrom.getDate() + 1)
                const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['Trial','30 days'])
                const idtype = inputType.rows[0].id
               await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ validfrom.toLocaleDateString(), validto.toLocaleDateString(), 'PENDING','PRO-TRIAL', id, idtype, ''])
            }
        }
    }

 }

 module.exports = {checkrowcount}