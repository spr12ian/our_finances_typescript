import { Spreadsheet } from "./Spreadsheet";
export function getMyEmailAddress() {
  // Use optional chaining to safely access the email address
  const myEmailAddress = getPrivateData()?.["MY_EMAIL_ADDRESS"];

  // Check if the email address exists and log accordingly
  if (myEmailAddress) {
    return myEmailAddress;
  } else {
    console.error("MY_EMAIL_ADDRESS not found in private data");
    return null; // Return null if the email is not found
  }
}

function getPrivateData() {
  const privateDataId = "1hxcINN1seSzn-sLPI25KmV9t4kxLvZlievc0X3EgMhs";
  const spreadsheet = Spreadsheet.openById(privateDataId);

  if (!spreadsheet) {
    return;
  }

  // Get data from sheet without header row
  const values = spreadsheet.raw.getDataRange().getValues().slice(1);

  if (values.length === 0) {
    return;
  }

  let keyValuePairs = {};

  values.forEach(([key, value]) => {
    if (key && value) {
      if (key && value) {
        keyValuePairs[key] = value; // Store the key-value pair in the object
      }
    }
  });

  return keyValuePairs;
}

function sendEmail(
  recipient: string,
  subject: string,
  body: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
) {
  return GmailApp.sendEmail(recipient, subject, body, options);
}

export function sendMeEmail(
  subject: string,
  emailBody: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
) {
  const body = `${subject}\n\n${emailBody}`;
  return sendEmail(getMyEmailAddress(), subject, body, options);
}
