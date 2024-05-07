const winds = require("./index.js");
const fs = require("fs");
winds.getWindsAloft("FD1", {}).then((sixHour) => {
  console.log(sixHour[0].parsedProductText);
  fs.writeFileSync("exampleoutput.json", JSON.stringify(sixHour, null, 2));
});
