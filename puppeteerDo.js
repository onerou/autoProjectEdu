const puppeteer = require('puppeteer');
// global.config = require('./config.js');
// console.log("TCL: config", config)
var urlList = [],
	t,
	listType = 'Document',
	pageUrl = {
		Document: 'DocumentKnowledge',
		Video: 'VideoKnowledge'
	};
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
	// await doLogin(login, config);
	await doLogin(login);

	// })
};
const goList = async () => {
	global.page++;
	await global.list.goto(
		`http://edu.piesat.cn/kng/knowledgecatalogsearch.htm?t=${pageUrl[listType]}&sf=UploadDate&s=dc&ps=50&pi=` +
		global.page
	);
	await doList(list);
};
const doLogin = async (login, config) => {
	// console.log("TCL: doLogin -> config", config)
	const loginForm = await login.$('#dvUserNameLoginPanel');
	await loginForm.$eval('#txtUserName2', (userInput) => (userInput.value = '用户名')); // 用户名
	await loginForm.$eval('#txtPassword2', (passInput) => (passInput.value = '密码')); // 密码
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
		let list = [...document.querySelectorAll('.el-placehold-body')];
		return list.map((v) => {
			return 'http://edu.piesat.cn' + v.getAttribute('onclick').split("'")[1];
		});
	});
	// await getDocumentPage(urlList);
	await eval(`get${listType}Page(urlList)`);
};
const getDocumentPage = async (list) => {
	try {
		t && clearInterval(t);
		if (list.length == 0) {
			goList();
		}
		let datePage = await global.browser.newPage();
		let url = list.shift();
		if (!url || typeof url != 'string') {
			// console.log('TCL: getDocumentPage -> url', url);
			await datePage.close();
			await getDocumentPage(list);
			return;
		}
		await datePage.goto(url);
		t = await setInterval(async () => {
			let flag = await datePage.evaluate(() => {
				return $('#ScheduleText').text() == '100%';
			});
			if (flag) {
				await datePage.close();
				// await setTimeout(async () => {
				clearInterval(t);
				getDocumentPage(list);
				// },);
				return;
			} else {
				datePage.evaluate(() => {
					submitStudy();
					SyncSchedule();
				});
			}
		}, 1000);
		// await setTimeout(async () => {
		// 	await datePage.close();
		// 	clearInterval(t);
		// 	await getDocumentPage(list);
		// }, 30000);
	} catch (err) {
		console.log(err);
	}
};
const getVideoPage = async (list) => {
	try {
		t && clearInterval(t);
		if (list.length == 0) {
			await goList();
		}
		let url = list.shift();
		if (!url || typeof url != 'string') {
			console.log('TCL: goVideoPage -> url', url);
			await datePage.close();
			await goVideoPage(list);
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
				// await setTimeout(async () => {
				clearInterval(t);
				await goVideoPage(list);
				// });
				return;
			} else {
				await datePage.evaluate(() => {
					setInterval(() => {
						let time = $('.jw-text-duration').text().split(':');
						let videoTime = 0;
						let timeInterval = [1, 60, 3600];
						for (let index = time.length - 1; index <= 0; index--) {
							videoTime += time[index] * timeInterval[index];
						}
						console.log('TCL: t -> videoTime');
						$('#hidViewSchedule').val(videoTime + '');
						submitStudy();
						SyncSchedule();
					}, 1000);
				});
			}
		}, 1000);
	} catch (err) {
		console.log('TCL: getVideoPage -> err', err);
	}
};
module.exports = goFn;