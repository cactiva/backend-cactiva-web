class SignInResponse {
    constructor({ token }) {
      this.token = token;
    }
  }
  
  class SignUpResponse {
    constructor({
      token, refreshToken, expiresIn, email, id, message, firstName, lastName,  gender, phone, address, buy_type, verified
    }) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.expiresIn = expiresIn;
      this.email = email;
      this.id = id;
      this.firstName = firstName;
      this.lastName = lastName;
      this.gender = gender;
      this.phone = phone;
      this.address = address
      this.message = message;
      this.buy_type = buy_type;
      this.verified = verified;
    }
  }
  
  module.exports = {
    SignInResponse,
    SignUpResponse,
  };