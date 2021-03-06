const { Clientdb } = require("../../db/db");
const axios = require("axios");
const { createInvoice } = require("../invoices");
const timeStamp = Math.floor(Date.now() / 1000);

const getTeamInvoice = async (req, res) => {
  const { email1, email2, email3, email4, email5, pay } = req.body;

    const user = await Clientdb.query('SELECT * FROM "UserProfile" WHERE email = $1',[email1])
    const convert = pay * 17000
    const url = 'https://cactiva-web.web.andromedia.co.id/invoice/teamsuccess/'+email1+'/'+email2+'/'+email3+'/'+email4+'/'+email5

  try {
    if (!user.rows[0]) {
      res.send(new Error(USER_DOESNT_EXISTS));
    } else {

      createInvoice(timeStamp, email1, convert, url, res);

      // const checkInvId = user.rows[0].invoice_id;

      // if (checkInvId != 0) {
      //   await axios({
      //     method: "GET",
      //     url: "https://api.xendit.co/v2/invoices/" + checkInvId,
      //     headers: {
      //       "cache-contorl": "no-cache",
      //       authorization:
      //         "Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg=="
      //     }
      //   })
      //     .then(result => {
      //       if (result.data.status === "PENDING") {
      //         return res.send(result.data.invoice_url);
      //       } else if (result.data.status === "SETTLED") {
      //         return res.send("PAID");
      //       } else if (result.data.status === "PAID") {
      //         return res.send("PAID");
      //       } else if (result.data.status === "EXPIRED") {
      //         createInvoice(timeStamp, email1, convert, url, res);
      //       }
      //     })
      //     .catch(error => {
      //       return res.send(error.result);
      //     });
      // } else {
      //   createInvoice(timeStamp, email1, convert, url, res);
      // }
    }
  } catch (err) {
    throw err;
  }
};

module.exports = { getTeamInvoice };
