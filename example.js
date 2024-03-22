const winds = require("lib/index.js");

console.log(winds);
winds.FD1().then((result) => {
  console.log(JSON.stringify(result, null, 2));
});
