let number = 0
var t,
	pagenumber = 0
const goList = async () => {
	global.page++
	if (global.page > pagenumber) {
		global.spinner.stopAndPersist({
			symbol: '√',
			text: `所有文档已看完,共${global.page}页,共${number}篇文档`
		})
		notifierFn({
			title: '企业大学阅读程序',
			message: '所有文档已看完'
		})
		return
	}
	global.spinner.stop()
	global.spinner.text = `正在跳转第${global.page}页`
	global.spinner.start()
	await global.list.goto(
		`http://edu.piesat.cn/kng/knowledgecatalogsearch.htm?t=DocumentKnowledge&ps=50&pi=` + global.page
	)
	await doList(list)
}
const doList = async (list) => {
	const listDiv = await list.$('.el-kng-img-list')
	if (!listDiv) return
	pagenumber = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.pagenumber') ]
		return list[list.length - 1].innerText
	})
	let urlList = await list.evaluate(() => {
		let list = [ ...document.querySelectorAll('.el-placehold-body') ]
		return list.map((v) => {
			return 'http://edu.piesat.cn' + v.getAttribute('onclick').split("'")[1]
		})
	})
	await getDocumentPage(urlList)
}
const getDocumentPage = async (list) => {
	try {
		t && clearTimeout(t)
		if (list.length == 0) {
			goList()
			global.spinner.stop()
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
		global.spinner.text = `正在阅读${global.page}页,共${pagenumber}页,已读${number}篇文档`
		global.spinner.start()
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
module.exports = goList
