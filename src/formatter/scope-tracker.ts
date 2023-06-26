export type Attributes = {
  color?: string;
  bg?: string;
  bold?: boolean;
  underscore?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
  blink?: boolean;
  dimmed?: boolean;
  inverted?: boolean;
  join?: "space" | "none";
  noInherit?: boolean;
};

export type Scope = {
  tag?: string;
  attributes: Attributes;
};

export const DEFAULT_SCOPE: Scope = { tag: "", attributes: {} };

export class ScopeTracker {
  private static scopeStack: Scope[] = [DEFAULT_SCOPE];
  private static _currentScope: Scope = this.scopeStack[0]!;

  static get currentScope(): Scope {
    return this._currentScope;
  }

  static enterScope(scope: Scope) {
    const s = scope;
    this.scopeStack.push(s);
    this._currentScope = s;
  }

  static exitScope() {
    this.scopeStack.pop();
    this._currentScope =
      this.scopeStack[this.scopeStack.length - 1] ?? DEFAULT_SCOPE;
  }

  static traverseUp(callback: (scope: Readonly<Scope>) => void) {
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      callback(this.scopeStack[i]!);
    }
  }

  static isImmediateChildOf(...tags: string[]): boolean {
    const parent = this.scopeStack[this.scopeStack.length - 1];

    return tags.includes(parent?.tag ?? "-");
  }
}
