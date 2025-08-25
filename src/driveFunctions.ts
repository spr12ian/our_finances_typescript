import { FastLog } from "./support/FastLog";
export function outputToDrive(fileName: string, output: string) {
  // Overwrite if it already exists
  const existing = DriveApp.getFilesByName(fileName);
  if (existing.hasNext()) {
    const file = existing.next();
    file.setTrashed(true); // move old version to bin
  }

  DriveApp.createFile(fileName, output, "text/plain");
  FastLog.log(`Export complete: ${fileName} created in Drive.`);
}
