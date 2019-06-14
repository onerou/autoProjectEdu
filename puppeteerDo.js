const puppeteer = require('puppeteer');
var urlList = [],
	t;
const goFn = async () => {
	global.browser = await puppeteer.launch({
		defaultViewport: {
			width: 1400,
			height: 930
		},
		// devtools: true,
		// headless: false
		headless: true
	});
	global.page = 0;
	const login = await browser.newPage();
	await login.goto('http://edu.piesat.cn/login.htm');
	await doLogin(login);

	// })
};
const goList = async () => {
	global.page++;
	await global.list.goto(
		'http://edu.piesat.cn/kng/knowledgecatalogsearch.htm?t=DocumentKnowledge&sf=RecommendLevel&s=dc&ps=50&pi=' +
			global.page
	);
	await doList(list);
};
const doLogin = async (login) => {
	const loginForm = await login.$('#dvUserNameLoginPanel');
	await loginForm.$eval('#txtUserName2', (userInput) => (userInput.value = 'zhoubin'));
	await loginForm.$eval('#txtPassword2', (passInput) => (passInput.value = 'bin100411'));
	await loginForm.$eval('#btnLogin2', (loginBtn) => loginBtn.click());
	setTimeout(async () => {
		global.list = await global.browser.newPage();
		await goList();
	}, 2000);
};
const doList = async (list) => {
	const listDiv = await list.$('.el-kng-img-list');
	if (!listDiv) return;
	urlList = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.el-placehold-body') ];
		return list.map((v) => {
			return 'http://edu.piesat.cn' + v.getAttribute('onclick').split("'")[1];
		});
	});
	await goDatePage(urlList);
};
const goDatePage = async (list) => {
	try {
		t && clearInterval(t);
		if (list.length == 0) {
			goList();
		}
		let url = list.shift();
		if (!url || typeof url != 'string') {
			console.log('TCL: goDatePage -> url', url);
			datePage.close();
			await goDatePage(list);
			return;
		}
		let datePage = await global.browser.newPage();
		await datePage.goto(url);
		t = setInterval(async () => {
			let flag = await datePage.evaluate(() => {
				return $('#ScheduleText').text() == '100%';
			});
			if (flag) {
				await datePage.close();
				setTimeout(async () => {
					clearInterval(t);
					await goDatePage(list);
				});
				return;
			} else {
				await datePage.evaluate(() => {
					submitStudy();
				});
			}
		}, 1000);
	} catch (err) {
		console.log(err);
	}
};
module.exports = goFn;
