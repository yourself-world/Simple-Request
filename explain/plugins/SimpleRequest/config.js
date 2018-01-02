/**
 * 小程序网络请求插件的配置文件
 * 配置项说明:
 * 		saveCookie			=> 是否自动保存服务器端返回的cookie,默认不保存
 * 		contentType			=> 请求的内容类型,默认<application/json>
 * 		requestSign			=> 是否需要对请求的参数进行签名操作
 *   	signSecret			=> 签名的密钥
 *   	signParamName		=> 签名加密检验串提交的参数名
 *   	timeParamName		=> 签名时间戳提交的参数名
 *   	pageParamName 		=> 页数请求的参数名
 *   	pageSizeParamName	=> 每页条数请求的参数名
 * 		isOffset			=> 分页是否是以offset的形式
 *   	domain 				=> 访问的域名
 *   	commonUrl 			=> 地址库中的地址相同的url部分
 *   	urlBase 			=> 供请求框架选择的地址库
 *   	urlBase.item.url 	=> 地址模块的url地址,拼接效果:domain+commonUrl+urlBase.item.url
 *   	urlBase.item.param 	=> 请求所需的参数列表,数组类型
 *
 * @author phpman <h88305@qq.com>
 */

module.exports = {
	requestSign: 			false,
	signSecret: 			'your sign secret',
	signParamName: 			'sign',
	timeParamName: 			'timestamp',
	pageParamName: 			'start',
	pageSizeParamName: 		'count',
	isOffset:				true,
	domain: 				'https://api.douban.com',
	commonUrl: 				'/v2/movie',
	urlBase: {
		'coming_soon': {
			url: '/coming_soon',
			param: ['start', 'count']
		}
	}
};