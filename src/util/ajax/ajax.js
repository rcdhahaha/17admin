import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';

Vue.use(VueAxios, axios);

// 导入封装的回调函数
import {
    cbs,
    gbs
} from 'config/settings.js';

// 动态设置本地和线上接口域名
Vue.axios.defaults.baseURL = gbs.host;

/**
 * 封装axios的通用请求
 * @param  {string}   type      get或post
 * @param  {string}   url       请求的接口URL
 * @param  {object}   data      传的参数，没有则传空对象
 * @param  {Function} fn        回调函数
 * @param  {boolean}   tokenFlag 是否需要携带token参数，为true，不需要；false，需要。一般除了登录，都需要
 */
module.exports = function (type, url, data, fn, {
    cbFn,
    tokenFlag,
    errFn,
    host,
    headers,
    axios_opts
} = {}) {
    if (data.httpResourceUrl != null && data.httpResourceUrl != undefined && typeof(data.httpResourceUrl) != "undefined" && data.httpResourceUrl != '') {
        url += data.httpResourceUrl;
    }

    var options = {
        method: type,
        url: host || url,
        headers: headers && typeof headers === 'object' ? headers : {}
    };

    options[type === 'get' ? 'params' : 'data'] = data;

    // 分发显示加载样式任务
    this.$store.dispatch('show_loading');

    if (tokenFlag !== true) {
        //如果你们的后台不会接受headers里面的参数，打开这个注释，即实现token通过普通参数方式传
        // data.token = this.$store.state.user.userinfo.token;

        options.headers.Authorization = this.$store.state.user.userinfo.token_type + ' ' + this.$store.state.user.userinfo.token;
    }

    //axios内置属性均可写在这里
    if (axios_opts && typeof axios_opts === 'object') {
        for (var f in axios_opts) {
            options[f] = axios_opts[f];
        }
    }

    //发送请求
    Vue.axios(options).then((res) => {
        if (res.data.status === 200) {
            // console.dir(res.data);
            fn(res.data.data);
        }else if(res.data.status === 401){
            this.$store.dispatch('remove_userinfo');
            this.$router.push('/login');
        }  else {

            if (cbFn) {
                cbFn(res.data);
            } else {
                // 调用全局配置错误回调
                cbs.statusError.call(this, res.data);

                if (tokenFlag === true) {
                    errFn && errFn.call(this);
                }
            }

        }
        this.$store.dispatch('hide_loading');
    }).catch((err) => {
        this.$store.dispatch('hide_loading');
        cbs.requestError.call(this, err);

        errFn && errFn.call(this);
    });

};