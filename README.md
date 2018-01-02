# Simple Request

> Simple Request是一个十分简单、方便、友好且可维护性较高的微信小程序网络请求插件。旨在用更少的代码做更多的事情。

## 特点
- 通过配置文件来管理接口地址
- 方便的链式调用
- 自动分配数据到Page.data中
- 自动处理分页加载逻辑
- 更少的代码做更多的事情

## 一睹为快

### 需求1

> 获取一篇文章的数据，将响应的json数据中data属性值赋值到Page.data.article属性上。

#### 原生请求

```javascript
Page({
    data: {
        article: null
    },
    onLoad: function (options) {
        wx.request({
            url: 'https://www.your-domain.com/article.php',
            data: {
                id: 1
            },
            success: (res) => {
                let resData = res.data; //res.data为服务端响应的数据
                this.setData({article: resData.data});
            }
        });
    }
})
```

#### Simple Request

```javascript
Page({
    data: {
        article: null
    },
    onLoad: function (options) {
        wx.SQ('article', this).params(1).assign('data:article').post(); //One line of code
    }
})
```

---

### 需求2

> 获取新闻列表的数据，并对数据进行分页加载。

#### 原生请求

```javascript
Page({
    data: {
        page: 1,
        pageSize: 10,
        isEmpty: false,
        news: null
    },
    paging: function(){
        if(!isEmpty){
            wx.request({
                url: 'https://www.your-domain.com/news.php',
                data: {
                    page: this.page,
                    pageSize: this.pageSize
                },
                success: (res) => {
                    let resData = res.data.data;
                    if (resData.length < this.pageSize){
                        this.isEmpty = true;
                    }
                    if(resData.length > 0){
                        let list = this.page>1? this.data.news.concat(resData) : resData;
                        this.setData({news: list});
                    }
                }
            });
        }
    },
    onLoad: function (options) {
        this.paging();
    },
    onPullDownRefresh: function () {
        this.page = 1;
        this.isEmpty = false;
        this.paging();
        wx.stopPullDownRefresh(); //停止下拉刷新
    },
    onReachBottom: function () {
        if(this.isEmpty) return false;
        this.page++;
        this.paging();
    }
})
```

#### Simple Request

```javascript
Page({
  data: {
    news: null
  },
  onLoad: function (options) {
    wx.SQ('news-list', this).assign('data:news').paging().post(); //One line of code
  }
})
```

---

## 方法详解

### wx.SQ - 初始化网络请求插件

##### 参数

| param name | type | explain |
| --- | --- | --- |
| requestUrl | string | url地址或地址库配置名 |
| [PageObject] | object | 发起请求所在的Page对象 |

##### 返回值

> Object 返回网络请求对象

### url - 获取或设置请求地址

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [url] | string | url地址或地址库配置名 |

##### 返回值

> mixed 如果未传url则返回将要请求的url地址,反之返回网络请求对象

### pageObject - 设置当前发起网络请求所在的Page对象

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [Page] | object | 发起请求所在的Page对象 |

##### 返回值

> Object 返回网络请求对象

### sign - 是否需要对请求的参数进行签名操作

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [isSign] | boolean | 是否需要对本次请求的参数进行签名校验 |
| [signName] | string | 签名加密校验字符串提交的参数名，默认为sign |
| [timeName] | string | 签名时间戳提交的参数名，默认为timestamp |

##### 返回值

> Object 返回网络请求对象

### paging - 启用页面分页自动加载和处理

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [pageSize] | int | 每页条数 |
| [pageName] | string | 页数请求的参数名 |
| [pageSizeName] | string | 每页条数请求的参数名 |
| [last param] | boolean | 传入false则不会监听页面的上/下拉事件自动执行分页加载 |

##### 返回值

> Object 返回网络请求对象

### offset - 以偏移量的形式实现分页加载

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [offset] | int | 偏移量条数 |
| [limitName] | string | 页数请求的参数名 |
| [offsetName] | string | 每页条数请求的参数名 |

##### 返回值

> Object 返回网络请求对象

### pagingWhere - 设置分页条件，用于判断是否还有下一页的数据

> 如果服务端响应的json数据格式为以下格式，则不需要使用此函数来构造条件。  
{  
    data: [...],  
    totalPage: 10  
}

##### 参数

| param name | type | explain |
| --- | --- | --- |
| func | function | 设置分页条件的函数 |

##### 返回值

> Object 返回网络请求对象

### pagingRefresh - 分页刷新

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [success] | callback | 获取数据成功的回调函数 |

##### 返回值

> 无返回值

### pagingLoading - 继续加载下一页的数据

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [success] | callback | 获取数据成功的回调函数 |

##### 返回值

> 无返回值

### currentPage - 获取当前分页的页数

##### 参数

> 无需参数

##### 返回值

> int 返回当前页数

### page - 切换到分页的某个页数

##### 参数

| param name | type | explain |
| --- | --- | --- |
| p | int | 页数 |

##### 返回值

> Object 返回网络请求对象

### nextPage - 下一页或者下N页

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [size] | int | 在当前页数上加上N页，默认为1 |

##### 返回值

> Object 返回网络请求对象

### prevPage - 上一页或者上N页

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [size] | int | 在当前页数上减去N页，默认为1 |

##### 返回值

> Object 返回网络请求对象

### param - 设置单个请求参数，可多次调用

##### 参数

| param name | type | explain |
| --- | --- | --- |
| paramName | string | 参数名 |
| paramValue | mixed | 参数值 |

##### 返回值

> Object 返回网络请求对象

### params - 给地址库中参数列表的参数名指定一个或多个对应的参数值

##### 参数

> 可以依次传入多个参数

##### 返回值

> Object 返回网络请求对象

### paramObject - 将一个对象的所有属性值都设置为请求参数

##### 参数

| param name | type | explain |
| --- | --- | --- |
| paramObject | object | 参数对象 |
| [isConfigName] | boolean | 是否使用参数列表配置的参数名 |

##### 返回值

> Object 返回网络请求对象

### getParam - 取请求的参数值

##### 参数

| param name | type | explain |
| --- | --- | --- |
| [paramName] | string | 参数名 |

##### 返回值

> mixed 如果传入参数名则返回对应的参数值，反之返回所有参数

### removeParam - 删除某个请求参数，可多次调用

##### 参数

| param name | type | explain |
| --- | --- | --- |
| paramName | string | 参数名 |

##### 返回值

> Object 返回网络请求对象

### globalParam - 设置全局请求参数,后继的每一次请求都会自动携带

##### 参数

| param name | type | explain |
| --- | --- | --- |
| paramName | string | 参数名 |
| paramValue | mixed | 参数值 |

##### 返回值

> Object 返回网络请求对象

### removeGlobalParam - 删除某个全局请求参数,删除后将不会携带

##### 参数

| param name | type | explain |
| --- | --- | --- |
| paramName | string | 参数名 |
| [once] | boolean | 仅本次请求不携带,默认永久删除 |

##### 返回值

> Object 返回网络请求对象

### assign - 响应的json对象属性值分配到页面的data中

##### 参数

> 参数格式:  
    json数据成员属性名:页面data成员属性名  
例子:  
	 **wx.SQ('demo', this).assign('data:pageData', 'data.child:pageData', 'data.child:pageData.child').post();**  
*最后一个参数如果传true则会和原有数据进行concat操作，反之会覆盖*

##### 返回值

> Object 返回网络请求对象

### loading - 设置加载提示层的样式

##### 参数

| param name | type | explain |
| --- | --- | --- |
| style | mixed | 0-loading提示框(默认)，1-导航条加载动画，false-关闭加载提示层，string-设置加载提示层的文本 |

##### 返回值

> Object 返回网络请求对象

### method - 设置请求的方法,默认为GET

##### 参数

| param name | type | explain |
| --- | --- | --- |
| method | string | POST,GET,DELETE... |

##### 返回值

> Object 返回网络请求对象

### dataType - 设置响应的数据类型,默认为json

##### 参数

| param name | type | explain |
| --- | --- | --- |
| type | string | 如果设为json，会尝试对返回的数据做一次 JSON.parse |

##### 返回值

> Object 返回网络请求对象

### header - 设置请求头

##### 参数

| param name | type | explain |
| --- | --- | --- |
| headerName | mixed | header键名或者对象 |
| headerValue | string | header键值 |

##### 返回值

> Object 返回网络请求对象

### contentType - 设置请求的内容类型，默认application/json

##### 参数

| param name | type | explain |
| --- | --- | --- |
| content | mixed | 如果传入true会将数据转换成query string |

##### 返回值

> Object 返回网络请求对象

### cookie - 启用或设置cookie，默认不保存cookie信息

##### 参数

| param name | type | explain |
| --- | --- | --- |
| isCookie | mixed | boolean-启用或禁用cookie，string-设置为cookie |

##### 返回值

> Object 返回网络请求对象

### get - 实现get请求

##### 参数

> result：响应body数据，response：响应的对象含header头信息，that：当前网络请求对象

| param name | type | explain |
| --- | --- | --- |
| param 1 | callback | 请求成功的回调函数，参数[result, response, that] |
| param 2 | callback | 请求失败的回调函数，参数[response, that] |
| param 3 | callback | 请求完成的回调函数，参数[response, that] |

##### 返回值

> 无返回值

### post - 实现post请求

##### 参数

> result：响应body数据，response：响应的对象含header头信息，that：当前网络请求对象

| param name | type | explain |
| --- | --- | --- |
| param 1 | callback | 请求成功的回调函数，参数[result, response, that] |
| param 2 | callback | 请求失败的回调函数，参数[response, that] |
| param 3 | callback | 请求完成的回调函数，参数[response, that] |

##### 返回值

> 无返回值

### run - 运行请求

##### 参数

> result：响应body数据，response：响应的对象含header头信息，that：当前网络请求对象

| param name | type | explain |
| --- | --- | --- |
| success | callback | 请求成功的回调函数，参数[result, response, that] |
| fail | callback | 请求失败的回调函数，参数[response, that] |
| complete | callback | 请求完成的回调函数，参数[response, that] |

##### 返回值

> 无返回值

## 配置文件

### 配置项 

* **saveCookie：** 是否自动保存服务器端返回的cookie,默认不保存
* **contentType：** 请求的内容类型,默认<application/json>
* **requestSign：** 是否需要对请求的参数进行签名操作
* **signSecret：** 签名的密钥
* **signParamName：** 签名加密检验串提交的参数名
* **timeParamName：** 签名时间戳提交的参数名
* **pageParamName：** 页数请求的参数名
* **pageSizeParamName：** 每页条数请求的参数名
* **isOffset：** 分页是否是以offset的形式
* **domain：** 访问的域名
* **commonUrl：** 地址库中的地址相同的url部分
* **urlBase：** 供请求框架选择的地址库，使用对象的方式存储
* **urlBase.item.url：** 地址模块的url地址,拼接效果:domain+commonUrl+urlBase.item.url
* **urlBase.item.param：** 请求所需的参数列表,数组类型

完美
