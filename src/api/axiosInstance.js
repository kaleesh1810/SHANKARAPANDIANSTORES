// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  // Use http to match the API host used in your environment (dikshiserver)
  baseURL: "http://dikshiserver/jewellbisreact/api/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },

});

export default axiosInstance;


export const api = axios.create({
  baseURL: "http://dikshiserver/jewellbisreact/api/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});



