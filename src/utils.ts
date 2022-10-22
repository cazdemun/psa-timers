import { parse } from "date-fns";

export const trace = <T>(x: T) => {
  console.log(x);
  return x;
}

const normalizeNumbers = (n: number): number => n < 0 ? 0 : n;
const padMilliseconds = (n: number): string => {
  if (n < 10) return `00${n}`;
  if (n < 100) return `0${n}`;
  return `${n}`;
};
const padNumbers = (n: number, padding: number = 2): string => n < (10 ** (padding - 1)) ? `${Array(padding).join('0')}${n}` : `${n}`;

export const formatSecondsmmss = (n: number) => {
  const seconds = padNumbers(normalizeNumbers(n % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / 60)));
  return `${minutes}:${seconds}`
}

export const formatMillisecondsmmss = (n: number) => {
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000))));
  return `${minutes}:${seconds}`
}

// Not havin a mod in minutes is intentional
export const formatMillisecondsmmssSSS = (n: number) => {
  const milliseconds = padMilliseconds(normalizeNumbers(n % 1000));
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000))));
  return `${minutes}:${seconds}:${milliseconds}`
}

export const formatMillisecondsHHmmss = (n: number) => {
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000) % 60)));
  const hours = padNumbers(normalizeNumbers(Math.floor(n / (60 * 60 * 1000))));
  return `${hours}:${minutes}:${seconds}`
}

export const formatMillisecondsHHmmssSSS = (n: number) => {
  const milliseconds = padMilliseconds(normalizeNumbers(n % 1000));
  const seconds = padNumbers(normalizeNumbers(Math.floor(n / 1000) % 60));
  const minutes = padNumbers(normalizeNumbers(Math.floor(n / (60 * 1000) % 60)));
  const hours = padNumbers(normalizeNumbers(Math.floor(n / (60 * 60 * 1000))));
  return `${hours}:${minutes}:${seconds}:${milliseconds}`
}

export const mmssToMilliseconds = (s: string) => parse(s, 'mm:ss', new Date(0)).getTime();

export const validateInput = (testdate: string): boolean => {
  var date_regex = /^[0-5]\d:[0-5]\d$/;
  return date_regex.test(testdate);
}