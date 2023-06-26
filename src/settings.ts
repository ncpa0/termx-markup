import type { Attributes } from "./formatter/scope-tracker";
import { DEFAULT_SCOPE } from "./formatter/scope-tracker";

export let GlobalSettings: Settings;

export class Settings {
  private static _instance: Settings;

  static {
    this._instance = new Settings();
    GlobalSettings = this._instance;
  }

  static setDefaultAttribute<K extends keyof Attributes>(
    attribute: K,
    value: Attributes[K]
  ) {
    this._instance.setDefaultAttribute(attribute, value);
  }

  static disableWarnings(disable: boolean) {
    this._instance.disableWarnings(disable);
  }

  /**
   * When strict mode is enabled, formatter will throw errors
   * instead of logging warnings.
   */
  static enableStrictMode(enable: boolean) {
    this._instance.enableStrictMode(enable);
  }

  private _settings = {
    warnings: true,
    strictMode: false,
  };

  setDefaultAttribute<K extends keyof Attributes>(
    attribute: K,
    value: Attributes[K]
  ) {
    DEFAULT_SCOPE.attributes[attribute] = value;
  }

  disableWarnings(disable: boolean) {
    this._settings.warnings = !disable;
  }

  /**
   * When strict mode is enabled, formatter will throw errors
   * instead of logging warnings.
   */
  enableStrictMode(enable: boolean) {
    this._settings.strictMode = enable;
  }

  /** @internal */
  get __() {
    return this._settings;
  }
}
