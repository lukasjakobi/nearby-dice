type MarkColors = { body: string; pips: string; accent: string };

/** Shared vector artwork for the UI, launcher icons and native splash. */
export function logoMark({ body, pips, accent }: MarkColors, monochrome = false): string {
  const rear = `<g transform="rotate(-16 37 37)">
    <rect x="9" y="9" width="56" height="56" rx="16" fill="${monochrome ? 'white' : accent}"/>
    <circle cx="25" cy="25" r="5.5" fill="${monochrome ? 'black' : pips}"/>
    <circle cx="49" cy="49" r="5.5" fill="${monochrome ? 'black' : pips}"/>
  </g>`;
  const front = `<g transform="rotate(10 56 56)">
    <rect x="22" y="22" width="68" height="68" rx="20" fill="${monochrome ? 'black' : pips}"/>
    <rect x="25" y="25" width="62" height="62" rx="17" fill="${monochrome ? 'white' : body}"/>
    ${[
      [42, 42],
      [70, 42],
      [42, 70],
      [70, 70],
    ]
      .map(
        ([cx, cy]) =>
          `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${monochrome ? 'black' : pips}"/>`,
      )
      .join('')}
    <circle cx="56" cy="56" r="6.5" fill="${monochrome ? 'black' : accent}"/>
  </g>`;

  // Punch pips out of the monochrome silhouette so Android can tint it.
  return monochrome
    ? `<defs><mask id="mark"><rect width="96" height="96" fill="black"/>${rear}${front}</mask></defs><rect width="96" height="96" fill="white" mask="url(#mark)"/>`
    : rear + front;
}
