import { FastLog } from "../logging/FastLog";

/**
 * Create or overwrite a text file in My Drive root.
 * If multiple files share the name, updates the first match.
 * TODO: Adjust to target a specific folder.
 */
export function writeTextFileToDrive(fileName: string, contents: string): void {
  const fn = writeTextFileToDrive.name;
  const startTime = FastLog.start(fn, fileName);

  // Overwrite if it already exists
  const files = DriveApp.getFilesByName(fileName);
  if (files.hasNext()) {
    const file = files.next();
    file.setContent(contents);
  } else {
    DriveApp.createFile(fileName, contents, "text/plain");
  }

  FastLog.finish(
    fn,
    startTime,
    `Export complete: ${fileName} created in Drive.`
  );
}
