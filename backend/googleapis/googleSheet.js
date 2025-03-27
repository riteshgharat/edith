const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const SHEET_URL = process.env.GOOGLE_SHEET_URL; // Your Google Apps Script Web App URL

// Function to send data to Google Apps Script
async function sendToSheet(data) {
  try {
    const response = await axios.post(SHEET_URL, data, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data; // Response from Google Apps Script
  } catch (error) {
    console.error("❌ Error sending data to Google Sheets:", error);
    return "❌ Unable to process request!";
  }
}

module.exports = { sendToSheet };