import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

/**
 * One player's phone: a tab of the web build with its own stored data (`?as=`). Tabs of one
 * browser context reach each other over the web transport, like phones over Nearby.
 */
export class Phone {
  private constructor(
    readonly page: Page,
    readonly name: string,
  ) {}

  /** Opens a new phone and walks through onboarding as `name`. */
  static async open(context: BrowserContext, name: string): Promise<Phone> {
    const page = await context.newPage();
    await page.goto(`/?as=${name.toLowerCase()}`);
    const phone = new Phone(page, name);
    await phone.tap('Weiter');
    await phone.tap('Weiter');
    await page.getByRole('textbox').fill(name);
    await phone.tap('Los geht’s');
    await phone.sees(`Hallo, ${name}!`);

    return phone;
  }

  /** The host opens a lobby, everyone else joins, and the host starts the game. */
  static async startGame(context: BrowserContext, names: string[]): Promise<Phone[]> {
    const phones: Phone[] = [];
    for (const name of names) phones.push(await Phone.open(context, name));
    const [host, ...guests] = phones;
    await host.host();
    for (const guest of guests) await guest.join(host);
    await host.tap('Spiel starten');
    await host.tap('Jetzt starten');
    for (const phone of phones) await phone.sees('Runde 1 von 13');

    return phones;
  }

  /** The phone whose turn it is: the only one that can roll. */
  static async nextUp(phones: Phone[]): Promise<Phone> {
    const canRoll = (phone: Phone) =>
      phone.page.getByRole('button', { name: 'Würfeln', exact: true }).isVisible();
    let next: Phone | undefined;
    await expect
      .poll(async () => {
        for (const phone of phones) if (await canRoll(phone)) next = phone;

        return next?.name;
      })
      .toBeDefined();

    return next!;
  }

  /** A string names the whole button, not part of it. */
  tap(name: string | RegExp): Promise<void> {
    return this.page
      .getByRole('button', { name, exact: true })
      .filter({ visible: true })
      .first()
      .click();
  }

  /** Screens left behind stay in the DOM, hidden; only what is on screen counts. */
  sees(text: string | RegExp): Promise<void> {
    return expect(this.page.getByText(text).filter({ visible: true }).first()).toBeVisible();
  }

  /** Opens a lobby from the home screen. */
  async host(): Promise<void> {
    await this.tap('Hosten');
    await this.tap('Lobby öffnen');
    await this.sees('Rundencode');
  }

  /** Joins `host`'s round from the "In deiner Nähe" list. */
  async join(host: Phone): Promise<void> {
    await this.tap('Beitreten');
    await this.tap(new RegExp(`^${host.name}.*beitreten$`));
    await this.sees('Du bist dabei!');
  }

  /** Rolls once and enters the first field on offer. */
  async playTurn(): Promise<void> {
    await this.tap('Würfeln');
    await this.tap(/eintragen$/);
    // A field worth 0 points is struck instead.
    await this.tap(/^(Eintragen|Streichen)$/);
  }
}
