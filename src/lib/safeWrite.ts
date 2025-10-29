import {
  beginProgrammaticEdit,
  endProgrammaticEdit,
} from "@lib/programmaticEditGuard"

/** Wrap a single write operation inline without pulling in the full run wrapper */
export function safeWrite<T>(writeFn: () => T): T {
  beginProgrammaticEdit();
  try {
    return writeFn();
  } finally {
    endProgrammaticEdit();
  }
}
