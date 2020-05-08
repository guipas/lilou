module.exports = function cleanString (str) {
  const replacements = [
    [/\n+$/, ''],
    ['\033c', '']
  ];

  let cleanedString = str.toString();
  for (const replacement of replacements) {
    cleanedString = cleanedString.replace(...replacement);
  }

  return cleanedString;
}