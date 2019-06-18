const puppeteer = require('puppeteer');
// global.config = require('./config.js');
// console.log("TCL: config", config)
var urlList = [],
	t,
	listType = 'Document',
	pagenumber = 11,
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
	global.page = 6;
	const login = await browser.newPage();
	await login.goto('http://edu.piesat.cn/login.htm');
	// await doLogin(login, config);
	await doLogin(login);

	// })
};
const goList = async () => {
	global.page++;
	console.log('当前页', global.page);
	console.log('总页码', pagenumber);
	if (global.page >= pagenumber) {
		console.log('所有文档已看完');
		return;
	}
	await global.list.goto(
		`http://edu.piesat.cn/kng/knowledgecatalogsearch.htm?t=${pageUrl[listType]}&ps=50&pi=` + global.page
	,{
    timeout: 60000 //timeout here is 60 seconds
});
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
		// await login.close();
	}, 2000);
};
const doList = async (list) => {
	const listDiv = await list.$('.el-kng-img-list');
	if (!listDiv) return;
	pagenumber = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.pagenumber') ];
		return list[list.length - 1].innerText;
	});
	urlList = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.el-placehold-body') ];
		return list.map((v) => {
			return 'http://edu.piesat.cn' + v.getAttribute('onclick').split("'")[1];
		});
	});
	// console.log('TCL: doList -> urlList', urlList);
	await getDocumentPage(urlList);
	// await eval(`get${listType}Page(urlList)`);
	// await list.close();
};
const getDocumentPage = async (list) => {
	try {
		t && clearTimeout(t);
		if (list.length == 0) {
			goList();
			return;
		}
		let datePage = await global.browser.newPage();
		let url = list.shift();
		if (!url || typeof url != 'string') {
			console.log('TCL: getDocumentPage -> url', url);
			console.log('TCL: getDocumentPage -> list', list);
			await datePage.close();
			await getDocumentPage(list);
			return;
		}
		await datePage.goto(url,{
    timeout: 60000 //timeout here is 60 seconds
});
		let flag = await datePage.evaluate(() => {
			return $('#ScheduleText').text() == '100%';
		});
		if (flag) {
			await datePage.close();
			getDocumentPage(list);
			return;
		} else {
			await datePage.evaluate(() => {
				setInterval(async () => {
					submitStudy();
					SyncSchedule();
				}, 1000);
			});
			t = await setTimeout(async () => {
				await datePage.close();
				await getDocumentPage(list);
			}, 10000);
		}
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
		await datePage.goto(url,{
    timeout: 60000 //timeout here is 60 seconds
});
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
						let timeInterval = [ 1, 60, 3600 ];
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
