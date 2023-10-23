const fs = require("fs")
const { spawn } = require('child_process');
const sqlite3 = require("sqlite3")
const express = require("express")
const http = require('http');
const cors = require('cors');
const bodyParser = require("body-parser")

// import bannedCards from "./data/bannedCards.json"

const app = express()
app.use(cors()); //ajax client al server se http
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
const port = process.env.PORT || 4000;

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

async function getDB(dbFile, dbURL) {
	await execPromise(`curl -L -o "${dbFile}" "${dbURL}"`);
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(`${dbFile}`, sqlite3.OPEN_READONLY, (err) => {
			if (err) {
				console.log("Error in dabase open: "+err.message);
				resolve([]);
			}
			else
				console.log(`Connected to ${dbFile}`);
		});
		db.all("select id, name, replace(replace(desc,CHAR(13),''),CHAR(10),' ') as desc, str1 from texts", (err, rows) => {
			if(err) {
				console.log("Failed query: "+err);
				resolve([]);
			}
			resolve(rows);
		});
	});
}

async function initData() {
	// eslint-disable-next-line no-unused-vars, prefer-const
	let [cardsIT, cardsCH] = await Promise.all([
		getDB("cardsIT.cdb","https://github.com/Team13fr/IgnisMulti/blob/master/Italiano/cards.cdb?raw=true"),
		getDB("cardsCH.cdb","https://github.com/mycard/ygopro/blob/server/cards.cdb?raw=true")
	]);

	if(cardsIT.length === 0) cardsIT = require("./cardsIT.json")
	if(cardsCH.length === 0) cardsCH = require("./cardsCH.json")

	return {
		cardsCH,
		cardsIT
	}
}

function foreign(arr, id) {
	let card = arr.find((_) => _.id === id)
	let i = -1
	while (card === undefined && i < 2) {
		card = arr.find((_) => _.id === id + i)
		i += 2
	}
	if (card === undefined || card.desc === "[INVALID_DATA]")
		return "Undefined type of card or [INVALID_DATA]"
	return { name: card.name, desc: card.desc }
}

async function initServer() {
    const { cardsCH, cardsIT } = await initData()

	app.get('/', (req, res) => {
		res.status(200).json('Welcome, your app is working well');
	})

	app.get("/iteff", (req, res) => {
		return res.json(cardsIT)
	})

	app.get("/cheff", (req, res) => {
		return res.json(cardsCH)
	})

	app.get("/cheff/:id", (req, res) => {
		const id = +req.params.id
		return res.json(foreign(cardsCH,id))
	})

	app.get("/iteff/:id", (req, res) => {
		const id = +req.params.id
		return res.json(foreign(cardsIT,id))
	})

	const httpServer = http.createServer(app);
    httpServer.listen(port, function() { 
        console.log(`In ascolto sulla porta ${port}`);
    });
}

initServer()