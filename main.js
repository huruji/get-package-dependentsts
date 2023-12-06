// 1. 运行命令    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
// 2. 替换 wsurl 和 url
// 3. node ./main.js
const puppeteer = require('puppeteer')
const jsonfile = require('jsonfile')
const fs = require('fs')
const path = require('path')
const select = require('puppeteer-select')

const wsurl = 'ws://127.0.0.1:9222/devtools/browser/3cbd922e-c2a1-47bb-a3eb-aa5c0a875a84'
// const url2 = "https://tcs.bytedance.net/workprocess/6971247424669024771?mode=scan&task_ids=7173256439748641293&submit=directly";
// const url3 = 'https://tcs.bytedance.net/workprocess/6677808795546026509/?mode=scan&task_ids=7180498975613518371&submit=directly'
const url = 'https://github.com/replicate/replicate-javascript/network/dependents'

const sleep = async (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1)
    }, 1000 * time)
  })
}
  ; (async () => {
    try {
      const browser = await puppeteer.connect({
        browserWSEndpoint: wsurl,
        defaultViewport: null
      })
      const page = await browser.newPage()
      await page.goto(url)
      await sleep(10)
      let shouldContinue = true
      const filePath = path.resolve(__dirname, './result.txt')
      const nextSelector = '#dependents .paginate-container .btn.BtnGroup-item:nth-child(2)'
      let pageNum = 1
      while (shouldContinue) {
        console.log(`开始第${pageNum}页数据`)
        const elHandleArray = await page.$$eval('#dependents .Box-row a.text-bold',els => els.map(el => el.href))
        const content = fs.readFileSync(filePath).toString().split('\n');
        const newContent = Array.from(new Set([...content, ...elHandleArray])).filter(n => n).join('\n')
        fs.writeFileSync(filePath, newContent)
        const hasNext = await page.$eval(nextSelector, (ele) => {
          return !ele.disabled
        })
        if(hasNext) {
          shouldContinue = true
        } else {
          shouldContinue = false
        }
        const nextBtn = await page.$(nextSelector)
        nextBtn.click()
        console.log('next button clicked')
        await sleep(10)
        pageNum++
      }
      console.log('task finished')
    } catch (err) {
      console.error(err)
    }
  })()
