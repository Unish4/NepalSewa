import i18n from "i18next";

const toDevnagariDigits = (num) => {
  const devnagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num)
    .split("")
    .map((char) => (char >= "0" && char <= "9" ? devnagariDigits[Number(char)] : char))
    .join("");
};

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const isNe = i18n.language === "ne";

  const intervals = [
    { label: "year", labelNe: "वर्ष", seconds: 31536000 },
    { label: "month", labelNe: "महिना", seconds: 2592000 },
    { label: "week", labelNe: "हप्ता", seconds: 604800 },
    { label: "day", labelNe: "दिन", seconds: 86400 },
    { label: "hour", labelNe: "घण्टा", seconds: 3600 },
    { label: "minute", labelNe: "मिनेट", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      if (isNe) {
        return `${toDevnagariDigits(count)} ${interval.labelNe} पहिले`;
      }
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return isNe ? "भर्खरै" : "just now";
};
