

const getActive = async (req, res) =>{
    const {email, password} = req.body

    try{
        const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email])
        const userPass = await Clientdb.query('SELECT password FROM "UserProfile" WHERE email = $1',[email])

        if(!user.rows[0]){
            res.send('user not exist')
        }
        const getIdUser = user.rows[0].id
        const isMatch = await comparePassword(password, userPass.rows[0].password)
        if(isMatch){
            updateLicense(getIdUser, res)
        }else{
            return res.send('password not match')
        }
    }catch(err){

    }
}

const updateLicense = async (id, res) =>{
    const requiredLicense = await Clientdb.query('Select * from "License" where userprofile_id = $1',[id])
            if(requiredLicense){
                const lastrowlicense = requiredLicense.rowCount - 1
                const getIdLicense = requiredLicense.rows[lastrowlicense].id
                const getDeadLine = requiredLicense.rows[lastrowlicense].valid_to
                const statustype = requiredLicense.rows[lastrowlicense].status
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

                if(statustype === 'PENDING'){
                    await Clientdb.query('UPDATE "License" Set "valid_from" = $1, "status" = $2, "valid_to" = $3 where "id" = $4',[getDateNow, 'ACTIVE', setDateThen,getIdLicense])
                    return res.send(setDateThen)
                }else if(statustype === 'ACTIVE'){
                    return res.send(getDeadLine)
                }else if(statustype === 'EXPIRED'){
                    return res.send("License Expired")
                }
            }else if(!requiredLicense){
                return res.send("No license")
            }
}

module.exports = {getActive}