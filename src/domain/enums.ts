/** Which score sheet is played: Classic (13 fields), Classic XL (17) or Scandinavian Yatzy (15). */
export enum Ruleset {
  Classic = 'classic',
  /** Classic plus Two Pairs, Even, Odd and Mini. */
  ClassicXl = 'classic-xl',
  Yatzy = 'yatzy',
}

/** A field on the score sheet. The five-of-a-kind field is `Category.Yatzy` in every ruleset. */
export enum Category {
  Ones = 'ones',
  Twos = 'twos',
  Threes = 'threes',
  Fours = 'fours',
  Fives = 'fives',
  Sixes = 'sixes',
  OnePair = 'one-pair',
  TwoPairs = 'two-pairs',
  ThreeOfAKind = 'three-of-a-kind',
  FourOfAKind = 'four-of-a-kind',
  FullHouse = 'full-house',
  SmallStraight = 'small-straight',
  LargeStraight = 'large-straight',
  Yatzy = 'yatzy',
  Chance = 'chance',
  /** Classic XL: sum of the even dice. */
  Even = 'even',
  /** Classic XL: sum of the odd dice. */
  Odd = 'odd',
  /** Classic XL: a sum of at most 10. */
  Mini = 'mini',
  /** With the lucky-number rule: the dice add up to this round's lucky number. */
  LuckyNumber = 'lucky-number',
}

/** How a further Yatzy may be used once the Yatzy field is taken. */
export enum Joker {
  Off = 'off',
  /** Matching upper field first, else Full House / straights at full value. */
  Official = 'official',
  /** Any open field; joker values apply once the matching upper field is taken. */
  Free = 'free',
}

export enum GameLength {
  Full = 'full',
  /** Six rounds; a sheet counts only the entries made. */
  Short = 'short',
}

export enum FieldOrder {
  Free = 'free',
  TopToBottom = 'top-to-bottom',
}

export enum StartingPlayer {
  Random = 'random',
  Host = 'host',
}

/** A player's link to the session, as the host sees it. */
export enum Link {
  Connected = 'connected',
  Lost = 'lost',
  Removed = 'removed',
  Left = 'left',
}
