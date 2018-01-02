/**
 * 根据个人使用习惯封装的助手函数
 * @author phpman <love_phpman@163.com>
 */

/**
 * 对Date的扩展，将 Date 转化为指定格式的String.
 * 占位符:
 *   年=y；可以用 1-4 个占位符.
 *   季度=q、月=m、日=d、小时=h、分=i、秒=s；可以用 1-2 个占位符.
 *   毫秒=S；只能用 1 个占位符(是 1-3 位的数字).
 * 例子：
 *   (new Date()).format("yyyy-mm-dd hh:ii:ss.S")   ==> 2017-11-01 08:09:04.423
 *   (new Date()).format("yyyy-mm-d h:i:s.S")       ==> 2017-7-7 8:9:4.18
 * @param {[type]} fmt 格式化的字符串
 */
Date.prototype.format = function (fmt) {
	var o = {
		"m+": this.getMonth() + 1,
		"d+": this.getDate(),
		"h+": this.getHours(),
		"i+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": Math.floor((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds()
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
}

/**
 * 获取当前时间戳,秒
 * @return {[type]} [description]
 */
wx.time = wx.time || function () {
	var timestamp = new Date().getTime();

	return parseInt(timestamp / 1000);
}
/**
 * 获取当前时间戳,毫秒
 * @return {[type]} [description]
 */
wx.mstime = wx.mstime || function () {
	return new Date().getTime();
}
/**
 * 格式化时间戳,秒
 * @param  {[type]} format    格式
 * @param  {[type]} timestamp 时间戳
 * @return {[type]}           [description]
 */
wx.time_format = wx.time_format || function (format, timestamp) {
	format = format || 'yyyy-mm-d hh:ii:ss';
	var date = timestamp ? new Date(timestamp * 1000) : new Date();

	return date.format(format);
}
/**
 * 格式化时间戳,毫秒
 * @param  {[type]} format    格式
 * @param  {[type]} timestamp 时间戳
 * @return {[type]}           [description]
 */
wx.mstime_format = wx.mstime_format || function (format, timestamp) {
	format = format || 'yyyy-mm-d hh:ii:ss.S';
	var date = timestamp ? new Date(timestamp) : new Date();

	return date.format(format);
}
/**
 * 剩余时间格式化
 * @param  {[type]}   endTime   剩余时间的时间戳,精确到秒,如果需要精确到毫秒可以除于1000
 * @param  {[String]} format    格式:%d天%h小时%m分钟%s.%q秒
 * @param  {[int]}    precision 精确度:0-天,1-小时,2-分钟
 * @return {[type]}          [description]
 */
wx.surplusTimeFormat = wx.surplusTimeFormat || function (endTime, format, precision) {
	var daySecond = 3600 * 24; //一天的秒数
	var hrSecond = 3600; //一小时的秒数
	var mstime = new Date().getTime(); //获取当前时间
	endTime = endTime * 1000; //将时间戳转换为毫秒级
	var surplus = parseInt(endTime) - mstime; //剩余时间
	precision = (precision > 2 || !precision) ? 0 : precision;

	if (surplus <= 1000) {
		return false; //倒计时结束
	} else {
		var d = 0, h = 0, m = 0, s = 0, q = 0;

		if (precision == 0) {
			d = parseInt(surplus / daySecond / 1000);
			surplus -= daySecond * d * 1000;
		}

		if (precision != 2) {
			h = parseInt(surplus / hrSecond / 1000);
			surplus -= hrSecond * h * 1000;
		}

		m = parseInt(surplus / 60 / 1000);
		surplus -= 60 * m * 1000;

		s = parseInt(surplus / 1000);
		surplus -= s * 1000;

		q = parseInt(surplus);

		switch (precision) {
			case 1:
				format = format || '%h小时 %m分钟 %s.%q秒';
				break;
			case 2:
				format = format || '%m分钟 %s.%q秒';
				break;
			default:
				format = format || '%d天 %h小时 %m分钟 %s.%q秒';
		}
		d = d < 10 ? '0' + d : d;
		h = h < 10 ? '0' + h : h;
		m = m < 10 ? '0' + m : m;
		s = s < 10 ? '0' + s : s;
		return format.replace('%d', d).replace('%h', h).replace('%m', m).replace('%s', s).replace('%q', q);
	}
}
/**
 * 生成一个随机数
 * @param mai 最小值
 * @param max 最大值
 * */
wx.rand = wx.rand || function (min, max) {
	var range = max - min;
	var rand = Math.random();
	return (min + Math.round(rand * range));
}

/**
 * 判断一个变量是否已设置
*/
wx.isset = wx.isset || function (variable) {
	return typeof (variable) != 'undefined';
}

/**
 * 判断一个变量是否为空值
*/
wx.empty = wx.empty || function (variable) {
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