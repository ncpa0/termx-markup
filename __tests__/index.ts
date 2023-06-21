import { Styles } from "../src/formatter/text-renderer/styles";

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchAnsiString(expected: string): R;
      toContainAnsiStringWithStyles(expected: string, styles: Styles): R;
    }
  }
}

export {};
