export const addScriptToHtml = (htmlFileContent) => {
  return htmlFileContent
    .split("</body>")
    .map((part, i) => {
      if (i === 0) {
        return (part += `<script src="./index.js"></script>`);
      } else {
        return part;
      }
    })
    .join("</body>");
};
