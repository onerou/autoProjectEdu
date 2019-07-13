const puppeteer = require('puppeteer')
// global.config = require('./config.js');
const ora = require('ora')
var spinner = ora('Loading unicorns')
const notifier = require('node-notifier')
const path = require('path')
let number = 0
var urlList = [],
	t,
	listType = 'Course',
	pagenumber = 11,
	pageUrl = {
		Document: 'DocumentKnowledge',
		Video: 'VideoKnowledge',
		Course: 'CourseKnowledge'
	}
const goFn = async () => {
	global.browser = await puppeteer.launch({
		defaultViewport: {
			width: 1400,
			height: 930
		},
		devtools: true,
		headless: false
		// headless: true
	})
	global.page = 0
	spinner.text = `正在登陆用户`
	spinner.start()
	const login = await browser.newPage()
	await login.goto('http://edu.piesat.cn/login.htm')
	// await doLogin(login, config);
	await doLogin(login)

	// })
}
const goList = async () => {
	global.page++
	if (global.page > pagenumber) {
		spinner.stopAndPersist({
			symbol: '√',
			text: `所有文档已看完,共${global.page}页,共${number}篇文档`
		})
		notifierFn({
			title: '企业大学阅读程序',
			message: '所有文档已看完'
		})
		return
	}
	spinner.stop()
	spinner.text = `正在跳转第${global.page}页`
	spinner.start()
	await global.list.goto(
		`http://edu.piesat.cn/kng/knowledgecatalogsearch.htm?t=${pageUrl[listType]}&ps=50&pi=` + global.page,
		{
			timeout: 60000 //timeout here is 60 seconds
		}
	)
	await doList(list)
}
const doLogin = async (login, config) => {
	const loginForm = await login.$('#dvUserNameLoginPanel')
	await loginForm.$eval('#txtUserName2', (userInput) => (userInput.value = '用户名')) // 用户名
	await loginForm.$eval('#txtPassword2', (passInput) => (passInput.value = '密码')) // 密码
	await loginForm.$eval('#btnLogin2', (loginBtn) => loginBtn.click())
	setTimeout(async () => {
		global.list = await global.browser.newPage()
		await goList()
	}, 2000)
}
const doList = async (list) => {
	const listDiv = await list.$('.el-kng-img-list')
	if (!listDiv) return
	pagenumber = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.pagenumber') ]
		return list[list.length - 1].innerText
	})
	urlList = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.el-placehold-body') ]
		return list.map((v) => {
			return 'http://edu.piesat.cn' + v.getAttribute('onclick').split("'")[1]
		})
	})
	// await getDocumentPage(urlList)
	await getCoursePage(urlList)

	// await eval(`get${listType}Page(urlList)`);
	// await list.close();
}
const getDocumentPage = async (list) => {
	try {
		t && clearTimeout(t)
		if (list.length == 0) {
			goList()
			spinner.stop()
			return
		}
		let datePage = await global.browser.newPage()
		let url = list.shift()
		if (!url || typeof url != 'string') {
			await datePage.close()
			await getDocumentPage(list)
			return
		}
		await datePage.goto(url, {
			timeout: 60000 //timeout here is 60 seconds
		})
		spinner.text = `正在阅读${global.page}页,共${pagenumber}页,已读${number}篇文档`
		spinner.start()
		number++
		let flag = await datePage.evaluate(() => {
			return $('#ScheduleText').text() == '100%'
		})
		if (flag) {
			await datePage.close()
			getDocumentPage(list)
			return
		} else {
			await datePage.evaluate(() => {
				setInterval(async () => {
					submitStudy()
					SyncSchedule()
				}, 1000)
			})
			t = await setTimeout(async () => {
				await datePage.close()
				await getDocumentPage(list)
			}, 16000)
		}
	} catch (err) {
		console.log(err)
	}
}
const getVideoPage = async (list) => {
	try {
		t && clearInterval(t)
		if (list.length == 0) {
			await goList()
		}
		let url = list.shift()
		if (!url || typeof url != 'string') {
			await datePage.close()
			await goVideoPage(list)
			return
		}
		let datePage = await global.browser.newPage()
		await datePage.goto(url, {
			timeout: 60000 //timeout here is 60 seconds
		})
		t = setInterval(async () => {
			let flag = await datePage.evaluate(() => {
				return $('#ScheduleText').text() == '100%'
			})
			if (flag) {
				await datePage.close()
				// await setTimeout(async () => {
				clearInterval(t)
				await goVideoPage(list)
				// });
				return
			} else {
				await datePage.evaluate(() => {
					setInterval(() => {
						let time = $('.jw-text-duration').text().split(':')
						let videoTime = 0
						let timeInterval = [ 1, 60, 3600 ]
						for (let index = time.length - 1; index > 0; index--) {
							videoTime += time[index] * timeInterval[index]
						}
						$('#hidViewSchedule').val(videoTime + '')
						submitStudy()
						SyncSchedule()
					}, 1000)
				})
			}
		}, 1000)
	} catch (err) {}
}

const getCoursePage = async (list) => {
	try {
		t && clearTimeout(t)
		if (list.length == 0) {
			goList()
			spinner.stop()
			return
		}
		let datePage = await global.browser.newPage()
		let url = list.shift()
		if (!url || typeof url != 'string') {
			await datePage.close()
			await getCoursePage(list)
			return
		}
		await datePage.goto(url, {
			timeout: 60000 //timeout here is 60 seconds
		})
		spinner.text = `正在阅读${global.page}页,共${pagenumber}页,已读${number}篇课程包`
		spinner.start()
		number++
		let readflag = await datePage.evaluate(() => {
			return $('#lblStudySchedule').text() == '100.0'
		})
		let vidoFlag = await datePage.evaluate(() => {
			return $('.Knowledge_Video').length >= 1
		})
		if (readflag || vidoFlag) {
			await datePage.close()
			getCoursePage(list)
			return
		} else {
			let CourseList = await datePage.evaluate(() => {
				let list = [ ...document.querySelectorAll('.name.ellipsis a') ]
				return list.map((v) => {
					return 'http://edu.piesat.cn' + $(v).attr('href').split("'")[1]
				})
			})
			datePage.close()
			doCoursePage(CourseList, list)
		}
	} catch (err) {
		console.log(err)
	}
}

const doCoursePage = async (list, kechengList) => {
	try {
		t && clearTimeout(t)
		if (list.length == 0) {
			getCoursePage(kechengList)
			spinner.stop()
			return
		}
		let doCourse = await global.browser.newPage()
		let url = list.shift()
		if (!url || typeof url != 'string') {
			await doCourse.close()
			await doCoursePage(list, kechengList)
			return
		}
		await doCourse.goto(url, {
			timeout: 60000 //timeout here is 60 seconds
		})
		spinner.text = `正在阅读${global.page}页,共${pagenumber}页,已读${number}篇课程包`
		spinner.start()
		number++
		let flag = await doCourse.evaluate(() => {
			return $('#ScheduleText').text() == '100%'
		})
		if (flag) {
			await doCourse.close()
			doCoursePage(list, kechengList)
			return
		} else {
			await doCourse.evaluate(() => {
				setInterval(async () => {
					submitStudy()
					SyncSchedule()
				}, 1000)
			})
			t = await setTimeout(async () => {
				await doCourse.close()
				await doCoursePage(list, kechengList)
			}, 16000)
		}
	} catch (err) {
		console.log(err)
	}
}
const notifierFn = ({ title, message }) => {
	notifier.notify(
		{
			title: title,
			message: message,
			icon: path.join(__dirname, 'logo.png'), // Absolute path (doesn't work on balloons)
			sound: true, // Only Notification Center or Windows Toasters
			wait: true // Wait with callback, until user action is taken against notification
		},
		function(err, response) {
			// Response is response from notification
			if (err) {
				errLog(err)
				errLog(response)
			}
		}
	)
}
module.exports = goFn
