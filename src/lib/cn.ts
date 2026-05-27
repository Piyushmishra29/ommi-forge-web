export const cn = (...a: Array<string | undefined | false | null>): string =>
  a.filter(Boolean).join(' ');
