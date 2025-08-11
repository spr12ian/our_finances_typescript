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

function getPrivateData(): Record<string, string> | undefined {
  const privateDataId = "1hxcINN1seSzn-sLPI25KmV9t4kxLvZlievc0X3EgMhs";
  const spreadsheet: Spreadsheet | null = Spreadsheet.openById(privateDataId);

  if (!spreadsheet) {
    return;
  }

  // Get all rows except the header
  const values: unknown[][] = spreadsheet.raw
    .getDataRange()
    .getValues()
    .slice(1);

  if (values.length === 0) {
    return;
  }

  const keyValuePairs: Record<string, string> = {};

  values.forEach((row) => {
    const [key, value] = row as [string, string];
    if (key && value) {
      keyValuePairs[key] = value;
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
): void {
  const body = `${subject}\n\n${emailBody}`;
  const myEmailAddress = getMyEmailAddress();
  if (myEmailAddress) {
    sendEmail(myEmailAddress, subject, body, options);
  }
}
