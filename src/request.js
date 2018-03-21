/**
 * 根据个人的编程习惯，封装的一个微信小程序网络请求框架。
 * 为的就是降低代码的偶合，提高代码的可维护性。
 * @author huangxunyue <h88305@qq.com>
 */

var Config = require('config.js') || {}; //框架配置
var hexMd5 = require('md5.js'); //md5加密
var requestQueue = []; //请求队列
var requestCookie = ''; //请求响应的cookie

/**
 * 网络请求框架
 * @param  {[type]} requestUrl  url地址或地址库配置名
 * @param  {[type]} pageObject  当前发起网络请求所在的页面对象
 * @return {[type]}             返回网络请求对象,方便实现链式调用
 */
wx.SQ = wx.SQ || function(requestUrl, PageObject){
	var that 				= {},
		Request 			= {url:null, data: {}},
		contentType 		= Config.contentType,
		saveCookie			= Config.saveCookie || false,
		requestSign			= Config.requestSign || false,
		signParamName		= Config.signParamName || 'sign',
		timeParamName		= Config.timeParamName || 'timestamp',
		pageParamName		= Config.pageParamName || 'page',
		pageSizeParamName	= Config.pageSizeParamName || 'pageSize',
		isOffset 			= Config.isOffset || false,
		pageNumber			= 1,
		pageSizeNumber		= 10,
		pageWhereFunction	= null,
		isNextPage			= true,
		isPaging			= false,
		paramList			= [],
		assignList			= [],
		requestSuccess		= null,
		requestFail			= null,
		requestComplete		= null,
		loadingStyle		= 0,
		loadingText			= '玩命加载中';
		PageObject 			= PageObject || {};

	/**
	 * 判断一个变量是否为空
	 * @param  {[type]}  variable [description]
	 * @return {Boolean}          [description]
	 */
	function isEmpty(variable) {
		var varType = typeof (variable);
		if (varType == 'undefined') {
			return true;
		} else {
			switch (varType) {
				case 'string':
					return variable.length == 0;
				case 'boolean':
					return !variable;
				case 'number':
					return !variable;
				case 'object': //对象,数据,null
					for (var name in variable) {
						return false;
					}
					return true;
				default:
					return false;
			}
		}
	}

	/**
	 * 数据分配解析
	 * @param  {[type]} resData 响应的数据
	 * @return {[type]}         [description]
	 */
	function assignParse(resData){
		/**
		 * 循环查找一个成员属性值
		 * @param  {[type]} target   在这个对象上查找
		 * @param  {[type]} findName 查找的成员属性名
		 * @return {[type]}          [description]
		 */
		function loopFind(target, findName){
			var dotPos = findName.indexOf('.');
			if(dotPos > 0){
				var current = findName.substr(0, dotPos);
				return target[current]? loopFind(target[current], findName.substr(dotPos+1)) : false;
			}else{
				return target[findName] || false;
			}
		}

		/**
		 * 循环设置一个成员属性值
		 * @param  {[type]}  target   给这个对象上的成员设置属性值
		 * @param  {[type]}  setValue 设置的值
		 * @param  {[type]}  setName  成员的属性名
		 * @param  {Boolean} isMerge  设置的数据是覆盖还是合并
		 * @return {[type]}           [description]
		 */
		function loopSet(target, setValue, setName, isMerge){
			target = target || {};
			var dotPos = setName.indexOf('.');
			if(dotPos > 0){
				var current = setName.substr(0, dotPos);
				target[current] = loopSet(target[current], setValue, setName.substr(dotPos+1), isMerge);
			}else{
				target[setName] = (
									(isMerge || isPaging && pageNumber > 1)
									&& (target[setName] != null)
									&& (typeof target[setName] == 'object')
									&& (target[setName].length > 0)
								  )? target[setName].concat(setValue) : setValue;
			}
			return target;
		}

		if((typeof PageObject == 'object') && (typeof resData == 'object') && (assignList.length>0)){
			var pageData = PageObject.data;
			for(var index in assignList){
				var item = assignList[index];
				var findData = loopFind(resData, item.name);
				if((typeof item.alias == 'string') && (item.alias.indexOf('@') === 0)){
					if(isEmpty(findData)){
						continue;
					}
					item.alias = item.alias.substr(1);
				}
				pageData = loopSet(pageData, findData, item.alias, item.merge);
			}
			PageObject.setData(pageData); //将设置好的数据分配到页面中
		}
	}

	/**
	 * 分页处理
	 * @param  {[type]} resData 响应的数据
	 * @return {[type]}         [description]
	 */
	function pagingHandle(resData){
		if(isPaging && resData != null && typeof resData == 'object'){
			var currentPage = resData.page ? resData.page : pageNumber; //防止ios端页面数据不满屏时,下拉刷会同时触发上拉加载的bug
	        var currentPageSize = resData.pageSize ? resData.pageSize : pageSizeNumber;
			if (typeof pageWhereFunction == 'function'){
				if (pageWhereFunction(resData, currentPage, currentPageSize)){
					that.page(currentPage + 1);
				}else{
					isNextPage = false;
				}
			} else if (resData.totalPage || resData.data){
				if ((resData.totalPage <= currentPage) || (resData.data && resData.data.length < currentPageSize)) {
					isNextPage = false;
				} else {
					that.page(currentPage + 1);
				}
			} else {
				that.page(currentPage + 1);
			}
		}
	}

	/**
	 * 对请求参数进行签名操作
	 * @return {[type]} [description]
	 */
	function paramSign(){
		if(requestSign){
			that.removeParam(signParamName); //删除与签名校验参数同名的参数
			that.param('timestamp', parseInt(new Date().getTime() / 1000)); //设置签名时间戳(秒)
			var requestData = that.getParam();
			var paramJson = JSON.stringify(requestData);
		    var paramMd5 = hexMd5(paramJson);
		    var signString = hexMd5(paramMd5 + Config.signSecret);
		    that.param(signParamName, signString);
		}
	}

	/**
	 * 完美拼接两个url地址
	 * @param  {[type]} url1 [description]
	 * @param  {[type]} url2 [description]
	 * @return {[type]}      [description]
	 */
	function joinUrl(url1, url2){
		url1 = (url1.lastIndexOf('/') === url1.length-1)? url1 : url1+'/';
		url2 = (url2.indexOf('/') === 0)? url2.substr(1) : url2;
		return url1+url2;
	}

	/**
	 * 显示加载提示
	 * @return {[type]} [description]
	 */
	function showLoading(){
		if(loadingStyle === 1){
			wx.showNavigationBarLoading(); //显示导航条加载动画
		}else if(loadingStyle === 0){
			wx.showLoading({ title: loadingText }); //显示加载提示框
		}
	}

	/**
	 * 隐藏加载提示
	 * @return {[type]} [description]
	 */
	function hideLoading(){
		wx.hideNavigationBarLoading(); //隐藏导航条加载动画
		wx.hideLoading(); //隐藏加载提示框
	}

	/**
	 * 获取全局请求参数的缓存数据
	 * @return {[type]} [description]
	 */
	function getGlobalParam(){
		var globalParam = wx.getStorageSync('_request_global_param_');
		return globalParam || {};
	}

	/**
	 * 设置全局请求参数的缓存数据
	 * @param {[type]} param [description]
	 */
	function setGlobalParam(param){
		return wx.setStorageSync('_request_global_param_', param);
	}

	/**
	 * 初始设置全局请求参数
	 * @return {[type]} [description]
	 */
	function initGlobalParam(){
		var globalParam = getGlobalParam(); //获取全局请求参数
		for(var paramName in globalParam){
			that.param(paramName, globalParam[paramName]); //设置全局请求参数
		}
	}

	/**
	 * 初始化网络请求对象
	 * @return {[type]} [description]
	 */
	function initRequest(){
		/**
		 * 请求成功之后的回调
		 * @param  {[type]} res 响应的数据
		 * @return {[type]}     [description]
		 */
		Request.success = function (res) {
			assignParse(res.data); //分配页面数据
			pagingHandle(res.data); //分页处理
			if (typeof requestSuccess == 'function') {
				requestSuccess(res.data, res, that);
			}
		}
		/**
		 * 请求失败后的回调
		 * @param  {[type]} res 响应的数据
		 * @return {[type]}     [description]
		 */
		Request.fail = function (res) {
			if (typeof requestFail == 'function') {
				requestFail(res, that);
			}
		}
		/**
		 * 请求完成后的回调
		 * @param  {[type]} res 响应的数据
		 * @return {[type]}     [description]
		 */
		Request.complete = function (res) {
			requestCookie = res.header? res.header['Set-Cookie'] : ''; //保存服务端返回的cookie
			requestQueue.splice(requestQueue.indexOf(Request.url), 1); //将本次请求的url地址移出队列
			if (typeof requestComplete == 'function') {
				requestComplete(res, that);
			}
			if(requestQueue.length <= 0){
				hideLoading(); //隐藏加载提示
			}
		}
	}

	/**
	 * 初始化网络请求框架
	 * @return {[type]} [description]
	 */
	function init(){
		initGlobalParam(); //初始设置全局请求参数
		initRequest(); //初始化网络请求对象
		that.contentType(contentType); //设置请求的内容类型
		that.url(requestUrl); //初始化网络请求地址
		return that;
	}

	/**
	 * 获取或设置请求url
	 * @param  {[type]} url [description]
	 * @return {[type]}     [description]
	 */
	that.url = function(url){
		if(url){
			var urlBase = Config.urlBase;
			if(urlBase[url]){
				Request.url = joinUrl(joinUrl(Config.domain, Config.commonUrl), urlBase[url]['url']);
				paramList = urlBase[url]['param'] || []; //设置参数列表
			}else{
				Request.url = /^[A-Za-z]+:\/\//.test(url)? url : joinUrl(Config.domain, url);
			}
			return that;
		}else{
			return Request.url;
		}
	}

	/**
	 * 设置当前发起网络请求所在的页面对象
	 * @param  {[type]} Page [description]
	 * @return {[type]}      [description]
	 */
	that.pageObject = function(Page){
		PageObject = Page;
		return that;
	}

	/**
 	 * 是否需要对请求的参数进行签名操作
 	 * @param  {Boolean} isSign   [description]
 	 * @param  {[type]}  signName 签名加密校验字符串提交的参数名
 	 * @param  {[type]}  timeName 签名时间戳提交的参数名
 	 * @return {[type]}           [description]
 	 */
	that.sign = function (isSign, signName, timeName) {
		requestSign = isSign? true : false;
		signParamName = signName || signParamName;
		timeParamName	= timeName || timeParamName;
		return that;
	}

	/**
	 * 启用页面分页自动加载和处理
	 * @param  {[type]} pageSize     每页条数
	 * @param  {[type]} pageName     页数请求的参数名
	 * @param  {[type]} pageSizeName 每页条数请求的参数名
	 * @return {[type]}              [description]
	 */
	that.paging = function(pageSize, pageName, pageSizeName){
		isPaging 			= true;
		pageSizeNumber		= pageSize || 10;
		pageParamName		= pageName || pageParamName;
		pageSizeParamName	= pageSizeName || pageSizeParamName;

		if(arguments[arguments.length-1] !== false){
			/**
			 * 页面相关事件处理函数--监听用户下拉动作
			 * @return {[type]} [description]
			 */
			PageObject.onPullDownRefresh = function () {
				that.pagingRefresh(); //分页刷新
			}
			/**
			 * 监听页面上拉触底事件的处理函数
			 * @return {[type]} [description]
			 */
			PageObject.onReachBottom = function () {
				that.pagingLoading(); //分页加载
			}
		}

		return that.page(pageNumber).param(pageSizeParamName, pageSizeNumber);
	}

	/**
	 * 以偏移量的形式实现分页加载
	 * @param  {[type]} offset     偏移量条数
	 * @param  {[type]} limitName  页数请求的参数名
	 * @param  {[type]} offsetName 每页条数请求的参数名
	 * @return {[type]}            [description]
	 */
	that.offset = function(offset, limitName, offsetName){
		isOffset = true;
		return that.paging(offset, limitName, offsetName);
	}

	/**
	 * 设置分页条件，用于判断是否还有下一页的数据
	 * @param  {[type]} func 设置分页条件的函数
	 * @return {[type]}      [description]
	 */
	that.pagingWhere = function(func){
		if (typeof func == 'function') {
			pageWhereFunction = func; //设置分页条件处理函数
		}

		return that;
	}

	/**
	 * 分页刷新
	 * @param  {[type]} success 成功的回调函数
	 * @return {[type]}         [description]
	 */
	that.pagingRefresh = function(success){
		if(isPaging){
			that.page(1).run(success);
			wx.stopPullDownRefresh(); //停止下拉刷新
		}
	}

	/**
	 * 分页加载
	 * @param  {[type]} success 成功的回调函数
	 * @return {[type]}         [description]
	 */
	that.pagingLoading = function(success){
		if(isPaging && isNextPage){
			that.run(success);
		}
	}

	/**
	 * 获取当前分页的页数
	 * @return {[type]} [description]
	 */
	that.currentPage = function(){
		return pageNumber;
	}

	/**
	 * 切换到分页的某个页数
	 * @param  {[type]} p [description]
	 * @return {[type]}   [description]
	 */
	that.page = function(p){
		pageNumber = (p > 1) ? p : 1;
		isNextPage = (pageNumber == 1)? true : isNextPage;
		var pageParam = isOffset ? ((pageNumber - 1) * pageSizeNumber) : pageNumber;
		return that.param(pageParamName, pageParam);
	}

	/**
	 * 下一页或者下N页
	 * @param  {[type]} size [description]
	 * @return {[type]}      [description]
	 */
	that.nextPage = function(size){
		pageNumber += size || 1;
    	return that.page(pageNumber);
	}

	/**
	 * 上一页或者上N页
	 * @param  {[type]} size [description]
	 * @return {[type]}      [description]
	 */
	that.prevPage = function(size){
		pageNumber += size || 1;
    	return that.page(pageNumber);
	}

	/**
	 * 设置单个请求参数
	 * @param  {[type]} paramName  参数名
	 * @param  {[type]} paramValue 参数值
	 * @return {[type]}            [description]
	 */
	that.param = function(paramName, paramValue){
		Request.data = Request.data || {};
		var floatReg = /^[-\+]?\d+(\.\d+)$/;
		Request.data[paramName] = (typeof(paramValue) == 'number' && floatReg.test(paramValue))? paramValue.toString() : paramValue;
		return that;
	}

	/**
	 * 给地址库中参数列表的参数名指定一个或多个对应的参数值
	 * 注意:传入的参数值会根据参数列表的顺序设置
	 * @return {[type]} [description]
	 */
	that.params = function(){
		for (var index in arguments) {
			if (paramList[index]) {
				that.param(paramList[index], arguments[index]);
			}
		}
		return that;
	}

	/**
	 * 将一个对象的所有属性值都设置为请求参数
	 * @param  {[type]}  paramObject  参数对象
	 * @param  {Boolean} isConfigName 是否使用参数列表配置的参数名
	 * @return {[type]}               [description]
	 */
	that.paramObject = function(paramObject, isConfigName){
		if (typeof paramObject == 'object') {
			for (var paramName in paramObject) {
				if (isConfigName === true) {
					that.param(paramList[paramName], paramObject[paramName]);
				} else {
					that.param(paramName, paramObject[paramName]);
				}
			}
		}
		return that;
	}

	/**
	 * 获取某个请求的参数值
	 * @param  {[type]} paramName 不传则返回所有的请求参数
	 * @return {[type]}           [description]
	 */
	that.getParam = function(paramName){
		return paramName? Request.data[paramName] : Request.data;
	}

	/**
	 * 删除某个请求参数
	 * @param  {[type]} paramName 参数名
	 * @return {[type]}           [description]
	 */
	that.removeParam = function(paramName){
		if(Request.data && Request.data[paramName]){
			delete Request.data[paramName];
		}
		return that;
	}

	/**
	 * 设置全局请求参数,后继的每一次请求都会自动携带
	 * @param  {[type]} paramName  参数名
	 * @param  {[type]} paramValue 参数值
	 * @return {[type]}            [description]
	 */
	that.globalParam = function(paramName, paramValue){
		var globalParam = getGlobalParam();
	    globalParam[paramName] = paramValue;
	    setGlobalParam(globalParam);
		return that.param(paramName, paramValue);
	}

	/**
	 * 删除某个全局请求参数,删除后将不会携带
	 * @param  {[type]} paramName 参数名
	 * @param  {[type]} once      仅本次请求不携带,默认永久删除
	 * @return {[type]}           [description]
	 */
	that.removeGlobalParam = function(paramName, once){
		var globalParam = getGlobalParam();
		if(!once){
			if(globalParam[paramName]){
				delete globalParam[paramName];
				setGlobalParam(globalParam);
			}
		}
		return that.removeParam(paramName);
	}

	/**
	 * 响应的json数据对象的属性值分配到页面的data中
	 * 参数格式:
	 * 	json数据成员属性名:页面data成员属性名
	 * 例子:
	 *  data:pageData
	 * 	data.child:pageData
	 * 	data.child:pageData.child
	 * @return {[type]} [description]
	 */
	that.assign = function(){
		var merge = (arguments[arguments.length-1] === true)? true : false; //分配的数据是覆盖还合并
		var emptyNotSet = (arguments[arguments.length-1] === 0)? true : false; //如果返回的数据为空时则不设置
		for (var index in arguments) {
			var item = arguments[index];
			if(item && typeof item == 'string'){
				var format = item.split(':');
				var alias = format[1] || format[0];
				alias = (emptyNotSet && alias.indexOf('@') !== 0)? '@'+alias : alias;
				assignList.push({
					name: format[0],
					alias: alias,
					merge: merge
				});
			}
		}
		return that;
	}

	/**
	 * 设置加载提示层的样式
	 * @param  {[type]} style 设置提示层的样式或提示文本或关闭提示层
	 * style的取值:
	 * 		0 		=> 小程序loading提示框
	 * 	 	1 		=> 导航条加载动画
	 * 	  	false 	=> 关闭加载提示层
	 * 	    string 	=> 设置加载提示层的文本
	 * @return {[type]}       [description]
	 */
	that.loading = function(style){
		if (style === false) {
			loadingStyle = false;
		} else if (typeof style == 'number') {
			loadingStyle = style? 1 : 0;
		} else {
			loadingText = style;
		}
		return that;
	}

	/**
	 * 设置请求的方法,默认为GET
	 * @param  {[type]} method [description]
	 * @return {[type]}        [description]
	 */
	that.method = function (method) {
		Request.method = method;
		return that;
	}

	/**
	 * 设置响应的数据类型,默认为json
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	that.dataType = function(type){
		Request.dataType = type;
    	return that;
	}

	/**
	 * 设置请求头
	 * @param {[type]} headerName  header键名或者对象
	 * @param {[type]} headerValue header键值
	 */
	that.header = function (headerName, headerValue) {
		Request.header = Request.header || {};
		switch(typeof headerName){
			case 'string':
				Request.header[headerName] = headerValue;
				break;
			case 'object':
				Request.header = headerName;
				break;
		}
		return that;
	}

	/**
	 * 设置请求的内容类型
	 * @param  {[type]} content 	[description]
	 * @return {[type]}             [description]
	 */
	that.contentType = function(content){
		if(content === true){
			that.header('content-type', 'application/x-www-form-urlencoded');
		}else if(typeof content == 'string'){
			that.header('content-type', content);
		}else{
			that.header('content-type', 'application/json');
		}
		return that;
	}

	/**
	 * 设置cookie
	 * @param  {Boolean} isCookie [description]
	 * @return {[type]}           [description]
	 */
	that.cookie = function(isCookie){
		if(typeof isCookie == 'boolean'){
			saveCookie = isCookie;
		}else if(typeof isCookie == 'string'){
			requestCookie = isCookie;
		}else{
			saveCookie = true;
		}
		return that;
	}

	/**
 	 * 是否发起同步网络请求,默认是异步请求非阻塞模式.
 	 * 注意:暂不支持同步请求
 	 * @return {[type]} [description]
 	 */
	that.sync = function(){
		Request.async = false;
		return that;
	}

	/**
	 * 实现get请求
	 * @return {[type]} [description]
	 */
	that.get = function () {
		that.run(arguments[0], arguments[1], arguments[2]);
	}

	/**
	 * 实现post请求
	 * @return {[type]} [description]
	 */
	that.post = function () {
		that.method('POST').run(arguments[0], arguments[1], arguments[2]);
	}

	/**
	 * 运行请求
	 * @param  {[type]} success  请求成功的回调函数
	 * @param  {[type]} fail     请求失败的回调函数
	 * @param  {[type]} complete 请求完成的回调函数
	 * @return {[type]}          [description]
	 */
	that.run = function (success, fail, complete) {
		if(isNextPage && (!isPaging || (requestQueue.indexOf(Request.url) < 0))){ //是否开启唯一请求
			requestSuccess 	= success || requestSuccess;
			requestFail 	= fail || requestFail;
			requestComplete	= complete || requestComplete;

			if(saveCookie && requestCookie){
				that.header('cookie', requestCookie); //提交cookie
			}

			showLoading();//显示加载提示
			paramSign(); //对请求的参数进行签名操作
			requestQueue.push(Request.url); //将本次请求的地址添加到队列里
			wx.request(Request); //发起网络请求
		}
	}

	return init(); //返回初始化完成的网络请求对象
}