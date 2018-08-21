import React, { Component } from "react";

const appKey = "FFFF0N0000000000690D";

export default class NoCaptcha extends Component {
  loadScript = (callback, src) => {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.id = "nc_script";
    if (script.readyState) {
      //IE
      script.onreadystatechange = function() {
        if (
          script.readyState === "loaded" ||
          script.readyState === "complete"
        ) {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      //Others
      script.onload = function() {
        callback();
      };
    }

    script.src = src;
    document.getElementsByTagName("head")[0].appendChild(script);
  };

  componentDidMount() {
    const { scene, ncCallback } = this.props;

    if (
      window.navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      )
    ) {
      //手机
      this.loadScript(() => {
        let nc_token = [appKey, new Date().getTime(), Math.random()].join(":");

        var nc = window.NoCaptcha.init({
          renderTo: `#nc_dom_id`,
          appkey: appKey,
          scene: scene,
          token: nc_token,
          customWidth: 300,
          is_Opt: 0,
          language: "cn",
          timeout: 10000,
          retryTimes: 5,
          errorTimes: 5,
          inline: false,
          apimap: {},
          bannerHidden: false,
          initHidden: false,
          callback: function(data) {
            ncCallback(appKey, nc_token, data);
          },
          error: function(s) {}
        });
        window.NoCaptcha.setEnabled(true);
        nc.reset(); //请务必确保这里调用一次reset()方法
        window.NoCaptcha.upLang("cn", {
          LOADING: "加载中...", //加载
          SLIDER_LABEL: "请向右滑动验证", //等待滑动
          CHECK_Y: "验证通过", //通过
          ERROR_TITLE: "非常抱歉，这出错了...", //拦截
          CHECK_N: "验证未通过", //准备唤醒二次验证
          OVERLAY_INFORM: "经检测你当前操作环境存在风险，请输入验证码", //二次验证
          TIPS_TITLE: "验证码错误，请重新输入" //验证码输错时的提示
        });
      }, "//g.alicdn.com/sd/nch5/index.js?t=2015052012");
    } else {
      //电脑
      this.loadScript(() => {
        let nc_token = [appKey, new Date().getTime(), Math.random()].join(":");
        let NC_Opt = {
          renderTo: `#nc_dom_id`,
          appkey: appKey,
          scene: scene,
          token: nc_token,
          customWidth: 300,
          elementID: ["usernameID"],
          is_Opt: 0,
          language: "cn",
          isEnabled: true,
          timeout: 3000,
          times: 5,
          apimap: {},
          callback: function(data) {
            ncCallback(appKey, nc_token, data);
          }
        };
        let nc = new window.noCaptcha(NC_Opt);
        nc.upLang("cn", {
          _startTEXT: "请按住滑块，拖动到最右边",
          _yesTEXT: "验证通过",
          _error300:
            '哎呀，出错了，点击<a href="javascript:__nc.reset()">刷新</a>再来一次',
          _errorNetwork:
            '网络不给力，请<a href="javascript:__nc.reset()">点击刷新</a>'
        });
      }, "//g.alicdn.com/sd/ncpc/nc.js?t=2015052012");
    }

    this.loadScript(() => {});
  }

  componentWillUnmount() {
    let nc_script = document.getElementById("nc_script");
    if (nc_script) {
      document.getElementsByTagName("head")[0].removeChild(nc_script);
    }
  }

  render() {
    return <div id="nc_dom_id" className="nc-container" />;
  }
}
