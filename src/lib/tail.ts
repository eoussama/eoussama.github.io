/**
 * Where to cut a link's last word so the part kept on one line with its arrow stays
 * short: the whole word when it is, otherwise from a break inside it (a hyphen, dot,
 * slash or a query's "?", "=" or "&") or, failing one, its last few letters. The rest
 * is left to wrap, so a long address never runs off a narrow screen.
 *
 * @param word - The link's last word
 * @param most - The most letters to keep with the arrow
 * @returns Where the part kept with the arrow starts
 */
export function keepFrom(word: string, most = 14): number {
  if (word.length <= most) {
    return 0;
  }

  const at = [...word.matchAll(/[-./=?&]/g)].map(match => match.index + 1).find(i => word.length - i <= most && word.length - i >= 3);

  return at ?? word.length - 8;
}
