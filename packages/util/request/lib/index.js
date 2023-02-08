const fse = require("fs-extra");
const axios = require("axios");

const baseURL = fse.readFileSync(process.env.CLI_REQUEST_FILE).toString();
const request = axios.create({
  baseURL,
  timeout: 5000,
});

request.interceptors.response.use(
  (res) => {
    return res.data;
  },
  (err) => {
    return Promise.reject(err);
  }
);

module.exports = {
  request,
  baseURL,
};
