import { Spreadsheet } from "@domain";
import { toHtmlBody } from "@lib/html/htmlFunctions";
import { FastLog } from "../logging/FastLog";

// A pragmatic regex; don’t chase full RFC 5322.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailAddressType = string & { readonly __brand: "EmailAddress" };

export function sendMeHtmlEmail(
  subject: string,
  html: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
): void {
  const myEmailAddress = getMyEmailAddress();
  if (!myEmailAddress) return;

  const htmlBody = toHtmlBody(html);

  const textFallback = htmlToText(htmlBody) || subject; // must not be empty

  sendEmail(myEmailAddress, subject, textFallback, {
    ...options,
    htmlBody,
  });
}

// Local helper functions

function asEmail(s: string): EmailAddressType {
  if (!EMAIL_RE.test(s)) throw new Error(`Invalid email address: ${s}`);
  return s as EmailAddressType;
}

function getMyEmailAddress(): EmailAddressType | null {
  // Use optional chaining to safely access the email address
  const myEmailAddress = getPrivateData()?.["MY_EMAIL_ADDRESS"];

  // Check if the email address exists and log accordingly
  if (myEmailAddress) {
    return asEmail(myEmailAddress);
  } else {
    FastLog.error("MY_EMAIL_ADDRESS not found in private data");
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

// Minimal HTML helper (auto-makes a decent text fallback)
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sendEmail(
  recipient: EmailAddressType,
  subject: string,
  body: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {}
) {
  return GmailApp.sendEmail(recipient, subject, body, options);
}
