import { TermxFontColor } from "./colors/termx-font-colors";
import { MarkupFormatter } from "./formatter/formatter";

/**
 * A convenience class for formatting and printing markup to the
 * console.
 *
 * By default it will try to detect a `print` function in the
 * global scope, if it's not found it will try to use the
 * `console.log` function.
 *
 * (if neither `print` or `console.log` are available, global
 * Output will not be able to print until a print function is set
 * manually)
 *
 * What function is used for printing can be changed by calling
 * the `Output.setEnvPrint` function. This will change how the
 * global Output instance prints as well as any new Output
 * instances created after this change.
 *
 * Additionally, each instance of Output can be given a custom
 * print function that will override the global print function.
 */
export class Output {
  private static defaultEnvPrint?: (text: string) => void;
  private static globalOutput: Output;

  static {
    try {
      this.globalOutput = new Output();
    } catch (e) {
      // no-op
    }
  }

  /** Formats the given markup and prints it to the console. */
  static print(...markup: string[]): void {
    Output.globalOutput.print(...markup);
  }

  /**
   * Formats the given markup and prints it to the console, and
   * adds a new line character at the start of each markup
   * string.
   */
  static println(...markup: string[]): void {
    Output.globalOutput.println(...markup);
  }

  /**
   * Sets the default print function for the current environment.
   *
   * Setting a new default print function will not affect any
   * existing Output instances.
   */
  static setEnvPrint(envPrint: (text: string) => void): void {
    Output.defaultEnvPrint = envPrint;
    Output.globalOutput = new Output(envPrint);
  }

  private envPrint: (text: string) => void;

  /**
   * Creates a new Output instance.
   *
   * @param envPrint The print function to use for printing to
   *   the console.
   */
  constructor(envPrint?: (text: string) => void) {
    if (envPrint) {
      this.envPrint = envPrint;
    } else {
      if (Output.defaultEnvPrint) {
        this.envPrint = Output.defaultEnvPrint;
      } else if (typeof print === "function") {
        this.envPrint = print;
      } else if (typeof console !== "undefined" && console.log) {
        this.envPrint = (v) => console.log(v);
      } else {
        throw new Error(
          "Unable to detect print function for current environment."
        );
      }
    }
  }

  private printError(e: any) {
    if (e != null) {
      this.envPrint((e.toString() as string) + "\n");

      if (typeof e === "object" && e.stack) {
        this.envPrint((e.stack as string) + "\n");
      }
    }
  }

  private parseMarkupLines(markup: string[]): string[] {
    const result: string[] = [];

    for (const m of markup) {
      result.push(MarkupFormatter.format(m));
    }

    return result;
  }

  /** Formats the given markup and prints it to the console. */
  public print(...markup: string[]): void {
    try {
      const lines = this.parseMarkupLines(markup);

      for (const line of lines) {
        this.envPrint(line);
      }
    } catch (e) {
      this.envPrint(
        TermxFontColor.get("red") +
          "Failed to format/print given markup." +
          TermxFontColor.get("unset") +
          "\n"
      );
      this.printError(e);
    }
  }

  /**
   * Formats the given markup and prints it to the console, and
   * adds a new line character at the end of each given markup
   * string.
   */
  public println(...markup: string[]): void {
    try {
      const lines = this.parseMarkupLines(markup);

      for (const line of lines) {
        this.envPrint(line + "\n");
      }
    } catch (e) {
      this.envPrint(
        TermxFontColor.get("red") +
          "Failed to format/print given markup." +
          TermxFontColor.get("unset") +
          "\n"
      );
      this.printError(e);
    }
  }
}

/**
 * Holds a buffer of markup text to print to the console.
 *
 * Content of the buffer is printed to the console when the
 * flush() method is called.
 */
export class OutputBuffer {
  private static globalOutputBuffer: OutputBuffer = new OutputBuffer();

  /**
   * Formats the given markup and adds it to the current buffer.
   *
   * Once the buffer is flushed, the markup will be printed to
   * the console.
   */
  static print(markup: string): void {
    OutputBuffer.globalOutputBuffer.print(markup);
  }

  /**
   * Formats the given markup and adds it to the current buffer,
   * and adds a new line character at the start of each markup
   * string.
   *
   * Once the buffer is flushed, the markup will be printed to
   * the console.
   */
  static println(markup: string): void {
    OutputBuffer.globalOutputBuffer.println(markup);
  }

  private buffer: Array<{
    type: "print" | "println";
    markup: string;
  }> = [];

  /**
   * Creates a new OutputBuffer instance.
   *
   * @param output The Output instance to use for printing the
   *   buffer to the console. If not specified, the global Output
   *   instance will be used.
   */
  constructor(private output: typeof Output | Output = Output) {}

  /**
   * Formats the given markup and adds it to the current buffer.
   *
   * Once the buffer is flushed, the markup will be printed to
   * the console.
   */
  print(...markup: string[]) {
    this.buffer.push(
      ...markup.map((m) => ({ type: "print", markup: m } as const))
    );
  }

  /**
   * Formats the given markup and adds it to the current buffer,
   * and adds a new line character at the start of each markup
   * string.
   *
   * Once the buffer is flushed, the markup will be printed to
   * the console.
   */
  println(...markup: string[]) {
    this.buffer.push(
      ...markup.map((m) => ({ type: "println", markup: m } as const))
    );
  }

  /**
   * Flushes the current buffer, printing all markup to the
   * console.
   */
  flush() {
    for (const { type, markup } of this.buffer) {
      switch (type) {
        case "print":
          this.output.print(markup);
          break;
        case "println":
          this.output.println(markup);
          break;
      }
    }
    this.buffer = [];
  }

  /**
   * Pipes the content of the current buffer to the provided
   * OutputBuffer instance and returns that OutputBuffer.
   */
  pipe(output: OutputBuffer): OutputBuffer {
    if (this.buffer.length === 0) return output;
    output.buffer.push(...this.buffer);
    this.buffer = [];
    return output;
  }

  /**
   * Works like pipe(), but in the reverse direction. (i.e.
   * `output` -> `this` instead of `this` -> `output` )
   *
   * Pipes the content of the provided OutputBuffer instance to
   * the current buffer and returns the current OutputBuffer.
   */
  pipeReverse(output: OutputBuffer): OutputBuffer {
    if (output.buffer.length === 0) return this;
    this.buffer.push(...output.buffer);
    output.buffer = [];
    return this;
  }
}
