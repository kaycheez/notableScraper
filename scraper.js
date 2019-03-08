const puppeteer = require('puppeteer');

const BASE_URL = 'https://www.data.gov';

const scraper = {
  browser: null,
  page: null,

  init: async () => {
    scraper.browser = await puppeteer.launch({
      headless: false,
    })

    scraper.page = await scraper.browser.newPage();
  },

  search: async (searchStr, num) => {
    // results to return
    let res = []

    // Go to data.gov
    await scraper.page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // click and type search criteria into input
    const SEARCH_INPUT_SELECTOR = '#search-header'

    await scraper.page.type(SEARCH_INPUT_SELECTOR, searchStr);

    // click on search button
    const SEARCH_BUTTON_SELECTOR = 'body > header > div.header.banner.frontpage-search > div > form > div > span > button'

    await scraper.page.click(SEARCH_BUTTON_SELECTOR);

    await scraper.page.waitForNavigation()

    await scraper.page.waitFor(1000);


    // grab num of datasets

    const DATASET_NUM_SELECTOR = '#content > div.row.wrapper > div > section:nth-child(1) > div.new-results';

    let totalNum = await scraper.page.evaluate((sel) => {
      let html = document.querySelector(sel).innerHTML.split(' ');
      let num = +(html[20].replace('\n\n', ''));
      
      return num
    }, DATASET_NUM_SELECTOR);

    
    // calculate number of pages need to travel
    // let maxNum = totalNum < num ? totalNum : num

    let maxNum = num ? totalNum < num ? totalNum : num : totalNum

    const pagesNeeded = Math.ceil(maxNum/20)
    const DATA_LENGTH_SELECTOR = 'dataset-item'
    const DATA_NAME_SELECTOR = '#content > div.row.wrapper > div > section:nth-child(1) > div.module-content > ul > li:nth-child(LIST_INDEX) > div > h3 > a'
    const DATA_ORG_SELECTOR = '#content > div.row.wrapper > div > section:nth-child(1) > div.module-content > ul > li:nth-child(LIST_INDEX) > div > div.organization-type-wrap > span > span'
    const DATA_FORMAT_LENGTH_SELECTOR = '#content > div.row.wrapper > div > section:nth-child(1) > div.module-content > ul > li:nth-child(LIST_INDEX) > div > ul'
    const DATA_FORMAT_SELECTOR = '#content > div.row.wrapper > div > section:nth-child(1) > div.module-content > ul > li:nth-child(LIST_INDEX) > div > ul > li:nth-child(FORMAT_INDEX) > a';


    for (let k = 1; k <= pagesNeeded; k++) {

      if (k !== 1) {

        // let pageSelector = PAGE_SELECTOR.replace('PAGE_INDEX', k)
        let searchCrit = searchStr.split(' ').join('+')
        let pageURL = `https://catalog.data.gov/dataset?q=${searchCrit}&sort=score+desc%2C+name+asc&page=${k}`

        await Promise.all([
          scraper.page.waitForNavigation(),
          scraper.page.goto(pageURL)
        ]);

      }

      // grab list number on page
  
      
      let listLength = await scraper.page.evaluate((sel) => {
        return document.getElementsByClassName(sel).length;
      }, DATA_LENGTH_SELECTOR)
  
      // grab dataset info
      // grab format list to loop
  
  
      // Loop through each list item
      for (let i = 1; i <= listLength; i++) {

        if (res.length === maxNum) {
          break;
        }

        // replace list item index with loop index
        let nameSelector = DATA_NAME_SELECTOR.replace('LIST_INDEX', i)
        let orgSelector = DATA_ORG_SELECTOR.replace('LIST_INDEX', i)
        let formatLengthSelector = DATA_FORMAT_LENGTH_SELECTOR.replace('LIST_INDEX', i)
        let formatSelector = DATA_FORMAT_SELECTOR.replace('LIST_INDEX', i)
  
        // grab name and org
        let name = await scraper.page.evaluate((sel) => {
          return document.querySelector(sel).innerHTML
        }, nameSelector)
        
        let org = await scraper.page.evaluate((sel) => {
          return document.querySelector(sel).innerHTML
        }, orgSelector)
        
        // grab length of format
        let formatLength = await scraper.page.evaluate((sel) => {
          return document.querySelector(sel) ? document.querySelector(sel).children.length : 0;
        }, formatLengthSelector)
  
        // grab format
        let format = [];
  
        if (format) {
          for (let j = 1; j <= formatLength; j++) {
            let newFormatSelector = formatSelector.replace('FORMAT_INDEX', j)
    
            let currFormat = await scraper.page.evaluate((sel) => {
              return document.querySelector(sel).innerHTML
            }, newFormatSelector)
    
            format.push(currFormat)
          }
        }
  
        
        res.push({
          name: name,
          org: org,
          format: format
        })
      }

    }
    console.log(res)

    return res;
  }
  
}


module.exports = scraper;
