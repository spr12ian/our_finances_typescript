/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { MetaTransactions as Meta, MetaAccountsData } from "./constants";

export class Transactions {
  private readonly sheet: Sheet;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  get raw(): Sheet {
    return this.sheet;
  }

  evaluateQueryFunction(queryString: string) {
    const sheet = this.sheet;
    const dataRange = sheet.getDataRange(); // Adjust the range as needed
    const a1range = `Transactions!${dataRange.getA1Notation()}`;

    // Construct the QUERY formula
    const formula = `=IFNA(QUERY(${a1range}, "${queryString}"), 0.0)`;

    // Add the formula to a temporary cell to evaluate it
    const tempCell = sheet.getRange("Z1");
    tempCell.setFormula(formula);

    // Get the result of the QUERY function
    const result = tempCell.getValue();

    // Clear the temporary cell
    tempCell.clear();

    return result;
  }

  getTotalByYear(where: string, taxYear: string) {
    const queryString = `SELECT SUM(I) WHERE J='${taxYear}' AND ${where} LABEL SUM(I) ''`;
    const result = this.evaluateQueryFunction(queryString);
    return result;
  }

  update() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();

    // Header row you want
    const HEADER = MetaAccountsData.SHEET.HEADER;
    const START_ROW = MetaAccountsData.START_ROW;
    const END_COLUMN = "G"; // Adjust if Meta.NUM_COLUMNS changes

    // Collect account sheets (names start with "_")
    const exclude = new Set(["_CVITRA", "_SVI2TJ", "_SVI3BH"]);

    // {"AHALIF",'_AHALIF'!A2:G};{"BCHASE",'_BCHASE'!A2:G};{"BCHRND",'_BCHRND'!A2:G};{"BCHSAV",'_BCHSAV'!A2:G};{"BCOISA",'_BCOISA'!A2:G};{"BCOLOY",'_BCOLOY'!A2:G};{"BCYNER",'_BCYNER'!A2:G};{"BFAMIL",'_BFAMIL'!A2:G};{"BGOLDM",'_BGOLDM'!A2:G};{"BMETRO",'_BMETRO'!A2:G};{"BMOCHA",'_BMOCHA'!A2:G};{"BMOFWN",'_BMOFWN'!A2:G};{"BMOKID",'_BMOKID'!A2:G};{"BMONZO",'_BMONZO'!A2:G};{"BMOPAR",'_BMOPAR'!A2:G};{"BMOSAV",'_BMOSAV'!A2:G};{"BNSPBZ",'_BNSPBZ'!A2:G};{"BOAISA",'_BOAISA'!A2:G};{"BOAKNO",'_BOAKNO'!A2:G};{"BOXBUR",'_BOXBUR'!A2:G};{"BPAYPA",'_BPAYPA'!A2:G};{"BPOSTO",'_BPOSTO'!A2:G};{"BSAISA",'_BSAISA'!A2:G};{"BSANTA",'_BSANTA'!A2:G};{"BSASA2",'_BSASA2'!A2:G};{"BSASA3",'_BSASA3'!A2:G};{"BSASAV",'_BSASAV'!A2:G};{"BSATAX",'_BSATAX'!A2:G};{"BTES01",'_BTES01'!A2:G};{"BTESCO",'_BTESCO'!A2:G};{"BTRISA",'_BTRISA'!A2:G};{"BVANGA",'_BVANGA'!A2:G};{"BVMISA",'_BVMISA'!A2:G};{"BVMSAV",'_BVMSAV'!A2:G};{"BWALLE",'_BWALLE'!A2:G};{"CLLOYD",'_CLLOYD'!A2:G};{"CMETRO",'_CMETRO'!A2:G};{"JFIXES",'_JFIXES'!A2:G};{"JSANTA",'_JSANTA'!A2:G};{"JWALEU",'_JWALEU'!A2:G};{"SAMAZO",'_SAMAZO'!A2:G};{"SCHASE",'_SCHASE'!A2:G};{"SCHBST",'_SCHBST'!A2:G};{"SCHRND",'_SCHRND'!A2:G};{"SCHSAV",'_SCHSAV'!A2:G};{"SCOIS2",'_SCOIS2'!A2:G};{"SCOISA",'_SCOISA'!A2:G};{"SCOLOY",'_SCOLOY'!A2:G};{"SFAMIL",'_SFAMIL'!A2:G};{"SGOLDM",'_SGOLDM'!A2:G};{"SJL3BH",'_SJL3BH'!A2:G};{"SKI3BH",'_SKI3BH'!A2:G};{"SKROOO",'_SKROOO'!A2:G};{"SMETRO",'_SMETRO'!A2:G};{"SMOINX",'_SMOINX'!A2:G};{"SMONZ1",'_SMONZ1'!A2:G};{"SMONZO",'_SMONZO'!A2:G};{"SMOPOT",'_SMOPOT'!A2:G};{"SNSPBZ",'_SNSPBZ'!A2:G};{"SOAISA",'_SOAISA'!A2:G};{"SOAKNO",'_SOAKNO'!A2:G};{"SOXBUR",'_SOXBUR'!A2:G};{"SPAYPA",'_SPAYPA'!A2:G};{"SPOSTO",'_SPOSTO'!A2:G};{"SREVOL",'_SREVOL'!A2:G};{"SSACR1",'_SSACR1'!A2:G};{"SSACRD",'_SSACRD'!A2:G};{"SSAISA",'_SSAISA'!A2:G};{"SSANT1",'_SSANT1'!A2:G};{"SSANTA",'_SSANTA'!A2:G};{"SSAPRM",'_SSAPRM'!A2:G};{"SSAZ01",'_SSAZ01'!A2:G};{"SSAZ02",'_SSAZ02'!A2:G};{"SSAZ03",'_SSAZ03'!A2:G};{"SSTARB",'_SSTARB'!A2:G};{"SSTARL",'_SSTARL'!A2:G};{"STAFIX",'_STAFIX'!A2:G};{"STASAV",'_STASAV'!A2:G};{"STES01",'_STES01'!A2:G};{"STES02",'_STES02'!A2:G};{"STES03",'_STES03'!A2:G};{"STESCO",'_STESCO'!A2:G};{"STRISA",'_STRISA'!A2:G};{"SVANGA",'_SVANGA'!A2:G};{"SVIIRF",'_SVIIRF'!A2:G};{"SVMISA",'_SVMISA'!A2:G};{"SVMSAV",'_SVMSAV'!A2:G};{"SWALLE",'_SWALLE'!A2:G};{"SZOPA1",'_SZOPA1'!A2:G}

    const accountSheets = allSheets
      .map((s) => s.getName())
      .filter((name) => name.startsWith("_") && !exclude.has(name));

    if (accountSheets.length === 0) {
      throw new Error("No account sheets found.");
    }

    // Build array parts: {"SheetName", '_SheetName'!A2:G}
    const ranges = accountSheets.map((sheetName) => {
      return `{"${sheetName.slice(
        1
      )}",'${sheetName}'!A${START_ROW}:${END_COLUMN}}`;
    });

    // Top-level array includes the header row first
    const union = `{{"${HEADER.join('","')}"};${ranges.join(";")}}`;

    // Wrap in QUERY — skip rows where Col2 (Date) is empty
    const formula = `=QUERY(${union}, "select * where Col2 is not null", 1)`;

    this.sheet.getRange("A1").setFormula(formula);

    SpreadsheetApp.flush();
  }

  updateFormulas() {
    this.sheet.getRange("A1").setFormula("=ARRAYFORMULA('Accounts data'!A1:H)");
  }
}
