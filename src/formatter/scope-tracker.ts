export type Scope = {
  parentTag?: string;
  color?: string;
  bg?: string;
  bold?: boolean;
  underscore?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
  blink?: boolean;
  dimmed?: boolean;
  inverted?: boolean;
  noInherit?: boolean;
};

export class ScopeTracker {
  private static scopeStack: Scope[] = [
    {
      parentTag: "",
    },
  ];
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
    this._currentScope = this.scopeStack[this.scopeStack.length - 1] ?? {};
  }
}
