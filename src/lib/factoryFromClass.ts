import type { Ctor, Mixin, SheetFactory } from "../features/sheets/mixinTypes";
import type { Spreadsheet } from '@domain';

export function factoryFromClass<T>(Ctor: Ctor<T>) {
  const baseFactory: SheetFactory<T> = (s) => new Ctor(s);

  function withMixins<U1>(
    ...mixins: Array<Mixin<any, any>>
  ): SheetFactory<T & U1>;
  function withMixins<U1, U2>(
    ...mixins: Array<Mixin<any, any>>
  ): SheetFactory<T & U1 & U2>;
  function withMixins(...mixins: Array<Mixin<any, any>>): SheetFactory<any> {
    return (s: Spreadsheet) =>
      mixins.reduce((obj, m) => m(obj), baseFactory(s));
  }

  return {
    build: baseFactory, // plain “just new” if you want
    with: withMixins, // apply mixins to the instance
  };
}
