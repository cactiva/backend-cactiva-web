const { Clientdb } = require("../db/db.js");
const axios = require("axios");
const { USER_DOESNT_EXISTS } = require("../models/Errors");
const timeStamp = Math.floor(Date.now() / 1000);

const postInvoice = async (req, res) => {
  const { email, pay } = req.body;
  const user = await Clientdb.query(
    'SELECT * FROM "UserProfile" WHERE email = $1',
    [email]
  );
  const convert = pay * 17000;
  const url = "https://cactiva-web.web.andromedia.co.id/invoice/success/" + email;

  try {
    if (!user.rows[0]) {
      res.send(new Error(USER_DOESNT_EXISTS));
    } else {
      const checkInvId = user.rows[0].invoice_id;
      const pass = user.rows[0].password;

      if (checkInvId != 0) {
        await axios({
          method: "GET",
          url: "https://api.xendit.co/v2/invoices/" + checkInvId,
          headers: {
            "cache-contorl": "no-cache",
            authorization:
              "Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg=="
          }
        })
          .then(result => {
            if (result.data.status === "PENDING") {
              return res.send(result.data.invoice_url);
            } else if (result.data.status === "SETTLED") {
              return res.send("PAID");
            } else if (result.data.status === "PAID") {
              return res.send("PAID");
            } else if (result.data.status === "EXPIRED") {
              return res.send(createInvoice(timeStamp, email, convert, url));
            }
          })
          .catch(error => {
            return res.send(error.result);
          });
      } else {
        return res.send(createInvoice(timeStamp, email, convert, url));
      }
    }
  } catch (err) {
    throw err;
  }
};

const createInvoice = async (timeStamp, email, convert, urls) => {
  await axios({
    method: "POST",
    url: "https://api.xendit.co/v2/invoices",
    headers: {
      "cache-control": "no-status",
      "content-type": "application/json",
      authorization:
        "Basic eG5kX2RldmVsb3BtZW50X1U1eERTaWh5M3o0aHdvaEhmM05zMmlOMHVJd01KWWZ3YUtSZGk5VnlEN1RKTk51NTlkYmdpY2I2ZnVXSGFkOg=="
    },
    data: {
      external_id: timeStamp.toString(),
      amount: convert,
      payer_email: email,
      success_redirect_url: urls,
      description: "Activation Code Payment",
      payment_methods: ["CREDIT_CARD"]
    }
  })
    .then(async response => {
      const idInvoice = response.data.id;
      await Clientdb.query(
        'UPDATE "UserProfile" Set "invoice_id" = $1 where email = $2',
        [idInvoice, email]
      );

      return response.data.invoice_url;
    })
    .catch(err => {
      return err.response.data;
    });
};

// const comparePassword = (candidatePassword, passwordmore) => {
//     if(bcrypt.compareSync(candidatePassword,passwordmore)){
//         return true
//     }else{
//         return false
//     }
//   }

const validateInvoice = {
  schema: {
    body: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" }
      },
      required: ["email"]
    }
  }
};

module.exports = {
  postInvoice,
  validateInvoice,
  createInvoice
};
