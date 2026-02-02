#!/usr/bin/env node

import { google } from "googleapis";
import { readFile } from "fs/promises";
import { join } from "path";

async function initSheets() {
  const credentialsPath = join(process.cwd(), "credentials.json");
  const credentialsContent = await readFile(credentialsPath, "utf-8");
  const credentials = JSON.parse(credentialsContent);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

async function main() {
  const command = process.argv[2];
  const spreadsheetId = process.argv[3];
  const range = process.argv[4];

  if (!command || !spreadsheetId) {
    console.log("Usage:");
    console.log('  node cli.js sheets <spreadsheet-id>');
    console.log('  node cli.js read <spreadsheet-id> "A1:B2"');
    console.log('  node cli.js write <spreadsheet-id> "A1:B2" \'[["1","2"],["3","4"]]\'');
    return;
  }

  if ((command === "read" || command === "write") && !range) {
    console.log("Range is required for read/write commands");
    return;
  }

  const sheets = await initSheets();

  if (command === "sheets") {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);
    console.log(JSON.stringify(sheetNames, null, 2));
  } else if (command === "read") {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    console.log(JSON.stringify(response.data.values, null, 2));
  } else if (command === "write") {
    const values = JSON.parse(process.argv[5]);
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    console.log(`Successfully wrote ${response.data.updatedCells} cells`);
  } else {
    console.log("Usage:");
    console.log('  node cli.js read <spreadsheet-id> "A1:B2"');
    console.log('  node cli.js write <spreadsheet-id> "A1:B2" \'[["1","2"],["3","4"]]\'');
  }
}

main().catch(console.error);
