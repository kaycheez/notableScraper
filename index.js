const scraper = require('./scraper');

let search = 'health inspections'
let totalNum = 226;

(async () => {

  await scraper.init();

  let results = await scraper.search(search);

  return results
})()

