export const formatMillis = (millis: number) => {
  const minutes = Math.floor(millis / (1000 * 60));
  const seconds = Math.floor((millis % (1000 * 60)) / 1000);

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
