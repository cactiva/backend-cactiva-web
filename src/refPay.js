const { Clientdb } = require('./db/db')

const refPay = async (id) => {
    const referal = await Clientdb.query('SELECT * FROM "Referal" WHERE userprofile_id = $1',[id])
    const iduser = referal.rows[0].referal_user_id
    const userData = await Clientdb.query('SELECT * FROM "License" WHERE userprofile_id = $1',[iduser])
    const lastrow = userData.rowCount - 1
    const status = userData.rows[lastrow].status //Active or Pending
    const type = userData.rows[lastrow].type //Basic or Pro
    const from  = userData.rows[lastrow].valid_from
    const valid = userData.rows[lastrow].valid_to
    
    const dateNow = new Date()
    const getDateNow = dateNow.toLocaleDateString()

    const validto = new Date(valid)
    const validfrom = new Date(from)

    if(type === 'BASIC'){
        validto.setDate(validto.getDate() + 60)
        const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['Trial','60 days'])
        const idtype = inputType.rows[0].id
        await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ getDateNow, validto.toLocaleDateString(), 'ACTIVE','PRO-TRIAL', id, idtype, ''])
    }else if (type === 'PRO'){
        validto.setDate(validto.getDate() + 15)
        await Clientdb.query('UPDATE "License" Set "valid_to" = $1 where userprofile_id = $2',[validto.toLocaleDateString(), id])
    }else if (type === 'PRO-TRIAL'){
        if(status === 'ACTIVE'){
            validto.setDate(validto.getDate() + 60)
            validfrom.setDate(validfrom.getDate() + 1)
            const inputType = await Clientdb.query('Insert into "TypeLicense" ("type", "valuetype") values ($1, $2) returning *', ['Trial','60 days'])
            const idtype = inputType.rows[0].id
           await Clientdb.query('Insert into "License" ("valid_from", "valid_to", "status", "type", "userprofile_id", "typelicense_id", "invoice_id") values ($1, $2, $3, $4, $5, $6, $7)', [ validfrom.toLocaleDateString(), validto.toLocaleDateString(), 'PENDING','PRO-TRIAL', id, idtype, ''])
        }
    }
}

module.exports = { refPay }