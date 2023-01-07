import { MarkupFormatter } from "./formatter/formatter";

export class Output {
  private static defaultEnvPrint?: (text: string) => void;
  private static globalOutput: Output = new Output();

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

  /** Formats the given markup and prints it to the console. */
  public print(...markup: string[]): void {
    for (const m of markup) {
      this.envPrint(MarkupFormatter.format(m));
    }
  }

  /**
   * Formats the given markup and prints it to the console, and
   * adds a new line character at the start of each markup
   * string.
   */
  public println(...markup: string[]): void {
    for (const m of markup) {
      this.envPrint("\n" + MarkupFormatter.format(m));
    }
  }
}

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

  private buffer: string[] = [];

  constructor(private output: typeof Output | Output = Output) {}

  private appendToLastLine(markup: string) {
    const lastLine = this.buffer.pop();
    if (lastLine) {
      this.buffer.push(lastLine + markup);
    } else {
      this.buffer.push(markup);
    }
  }

  /**
   * Formats the given markup and adds it to the current buffer.
   *
   * Once the buffer is flushed, the markup will be printed to
   * the console.
   */
  print(...markup: string[]) {
    this.appendToLastLine(markup.join(""));
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
    this.buffer.push(...markup);
  }

  /**
   * Flushes the current buffer, printing all markup to the
   * console.
   */
  flush() {
    if (this.buffer.length === 0) return;
    this.output.print(...this.buffer);
    this.buffer = [];
  }

  /**
   * Pipes the content of the current buffer to another
   * OutputBuffer instance.
   */
  pipeTo(output: OutputBuffer) {
    if (this.buffer.length === 0) return;
    output.buffer.push(...this.buffer);
    this.buffer = [];
  }
}
