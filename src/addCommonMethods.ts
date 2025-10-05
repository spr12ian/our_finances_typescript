interface CanFormatSheet { formatSheet(): void }
export type HasSheet = { sheet: CanFormatSheet }  // every sheet class already has this at runtime
export type Ctor<T = any> = new (...a: any[]) => T;

export function addCommonMethods<C extends Ctor<HasSheet>>(Ctor: C): C {
  // attach once; idempotent
  if (!(Ctor.prototype as any).formatSheet) {
    (Ctor.prototype as any).formatSheet = function () {
      // `this` is a BankAccounts/Whatever instance
      return (this as HasSheet).sheet.formatSheet();
    };
  }
  return Ctor;
}
