/**
 * Options the browser harness passes in the page URL, e.g. `/?as=antonia&radio=bluetooth-off`
 * (docs/technical-design.md, Browser harness). Phones never have any.
 */
export enum HarnessParam {
  /** The player this tab plays; each name keeps its own stored data. */
  As = 'as',
  /** A `PermissionStatus` the web transport reports instead of `granted`. */
  Permission = 'permission',
  /** A `RadioState` the web transport reports instead of `ready`. */
  Radio = 'radio',
  /** A dev scenario to start on load. */
  Scenario = 'scenario',
  /** Seeds the dice of a scenario. */
  Seed = 'seed',
}
