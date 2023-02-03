//File exists================================================================================================
if (fs.existsSync('foo.txt')) {
	// ...
}

//Terminal arguments================================================================================================
const file = process.argv[2];
const option = process.argv[3];

//Append on file================================================================================================
fs.writeFileSync(`${curVideoToSplit.title}-splitter.txt`, timestamp, { flag: 'a+' }, (err) => {
    if (err) return console.log(err);
});

//CSV to JSON================================================================================================
function csvJSON(csv) {
	const lines = csv.toString().split("\n")
	const result = []
	const headers = lines[0].split("	")
	for (let i = 1; i < lines.length; i++) {
		const obj = {}
		const currentline = lines[i].split("	")
		for (let j = 0; j < headers.length; j++) {
			obj[headers[j]] =
				headers[j] === "id" ? +currentline[j] : currentline[j]
		}
		result.push(obj)
	}
	console.log("Parsed a csv")
	return result
}

//CMD command execution================================================================================================
import { exec } from "child_process"
const { spawn } = require('child_process');

function execPromise(cmd) {
	return new Promise((resolve, reject) => {
        exec(
            cmd,
            (error, stdout, stderr) => {
                error ? reject(error) : resolve(stdout);
            }
        );
	});
}

function execPromise(cmd) {
	return new Promise((resolve, reject) => {
        const process = spawn(cmd, [], { shell: true });
        process.stdout.setEncoding('utf8');
        process.stderr.setEncoding('utf8');
        let data = '';
        let error = '';
        process.stdout.on('data', stdout => {
            console.log(stdout);
            data += stdout.toString();
        });
        process.stderr.on('data', stderr => {
            console.log(stderr);
            error += stderr.toString();
        });
        process.on('error', err => {
            reject(err);
        });
        process.on('close', code => {
            if (code !== 0)
                reject(error)
            else
                resolve(data)
            process.stdin.end();
        });
	});
}

await execPromise(`curl -L -o "./server/data/${dbFile}" "${dbURL}"`);




//GET request================================================================================================
import request from "request"

function getAllSets() {
	console.log("Retrieving allsets...")
	return new Promise((resolve, reject) => {
		request(
			{
				//  url specificato con nome dal docker compose e non localhost
				url: `https://db.ygoprodeck.com/api/v7/cardsets.php`,
				method: "GET",
			},
			function (error, resp, body) {
				if (error || resp.statusCode !== 200) {
					console.log("Got allsets from LOCAL")
					resolve([])
				} else {
					console.log("Got allsets from API")
					resolve(JSON.parse(body))
				}
			}
		)
	})
}

//Static scraping================================================================================================
import request from "request"
import { load } from "cheerio"

function getFemaleCards() {
	console.log(`Retrieving all female cards`)
	return new Promise((resolve, reject) => {
		request(
			{
				//  url specificato con nome dal docker compose e non localhost
				url: `https://yugioh.fandom.com/wiki/Concept:Female_official_cards?limit=10000`,
				method: "GET",
			},
			function (error, resp, body) {
				if (error || resp.statusCode !== 200) {
					console.log("Got allsets from LOCAL")
					resolve({})
				} else {
					const list = {}
                    const $ = load(body);
					$(".smw-column-responsive li").each(function(idx, li) {
						const $li = $(li);
						load($li.html())("a").each(function(idx, a) {
							const $a = $(a);
							if($a.text() !== "+") {
								list[$a.text()] = true
							}
						});
					});
					console.log("Got all female cards")
                    resolve(list)
				}
			}
		)
	})
}

//Dynamic scraping================================================================================================
const puppeteer = require('puppeteer');

async function scraping () {
    const scrape_urls = ["62325", "58459"]; 
    const ris  = [];
    for(const scrape_url of scrape_urls) {
        for(let i = 0; i < 100; i++) {
            console.log(i);
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(`https://www1.123moviesgo.ac/watch-tv/watch-sonic-boom-2014-38349.${scrape_url}${i < 10 ? "0"+i : i}`);
            const data = await page.evaluate(() => {
                try {
                    const url = document.querySelector('#watch-iframe iframe').src;
                    const ep = document.querySelector('.on-air .film-detail .episode-number').textContent.replaceAll("\n","").replaceAll(" ","");
                    const title = (ep.length < 10 ? "Episode0"+ep.substr(7) : ep)+" "+document.querySelector('.on-air .film-detail .film-name a').text;
                    return {title, url};
                } catch(e) {
                    return e;
    
                }
            });
            if(Object.keys(data).length !== 0) ris.push(data);
            browser.close();
        }
    };
    console.log(JSON.stringify(ris));
};