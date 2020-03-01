class SignInResponse {
    constructor({ token }) {
      this.token = token;
    }
  }
  
  class SignUpResponse {
    constructor({
      token, refreshToken, expiresIn, email, id, message, firstName, lastName,  gender, phone, address
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
    }
  }
  
  module.exports = {
    SignInResponse,
    SignUpResponse,
  };