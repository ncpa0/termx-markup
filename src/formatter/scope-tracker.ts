export type Scope = {
  parentTag?: string;
  color?: string;
  bg?: string;
  bold?: boolean;
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
    const s = Object.assign({}, this._currentScope, scope);
    this.scopeStack.push(s);
    this._currentScope = s;
  }

  static exitScope() {
    this.scopeStack.pop();
    this._currentScope = this.scopeStack[this.scopeStack.length - 1] ?? {};
  }
}
