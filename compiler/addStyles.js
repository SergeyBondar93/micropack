const generateCssLinks = (stylesPaths) => {
  return stylesPaths
    .map((filename) => {
      return `<link rel="stylesheet" href="./styles/${filename}">`;
    })
    .join("");
};

export const addStylesToHtml = (htmlFileContent, stylesPaths) => {
  return htmlFileContent
    .split("</head>")
    .map((part, i) => {
      if (i === 0) {
        return (part += generateCssLinks(stylesPaths));
      } else {
        return part;
      }
    })
    .join("</head>");
};
