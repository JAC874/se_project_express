const ERROR_CODES = {
  BAD_REQUEST: 400,
  AUTHORIZATION_ERROR: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_EXISTS: 409,
  SERVER_ERROR: 500,
};

const ERROR_MESSAGES = {
  BAD_REQUEST:
    "the server cannot or will not process the request due to something that is perceived to be a client error ",
  AUTHORIZATION_ERROR: "Invalid username or password",
  FORBIDDEN: "This is a permissions issue",
  NOT_FOUND:
    "a server response that indicates the requested page could not be found",
  EMAIL_EXISTS: "User with this email already exists",
  SERVER_ERROR:
    "the server is unable to fulfill a request due to an unexpected condition or configuration issue",
  INVALID_EMAIL: "Invalid email format",
};

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
};
