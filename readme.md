# Email To Wechat

将cloudflare的自定义邮箱地址的邮件转发到email worker，借助 [cloudflare-wx-notice](https://github.com/Tinger-X/cloudflare-wx-notice) 将邮件推送到微信。

# 部署

## 准备工作

+ 部署 [cloudflare-wx-notice](https://github.com/Tinger-X/cloudflare-wx-notice)
+ 在 [测试公众号后台](https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login) 添加模板并记录模板ID `template-id`，模板应接收变量 `sender`（发件人邮箱地址）、`title`（邮件主题），如：
  ```text
  发件人：{{sender.DATA}}
  标 题：{{title.DATA}}
  ```

## 部署本服务

1. fork/clone本项目到本地
2. 安装依赖：`npm i`
3. 重命名 [wrangler-template.jsonc](wrangler-template.jsonc) 为 `wrangler.jsonc`
4. 修改 `wrangler.jsonc` 内容：
  + `vars.Receiver`：修改为cloudflare中认证的目标邮件地址
  + `vars.Template`：修改为模板ID `template-id`
  + `vars.NoticeUrl`：修改为 `wx-notice` 服务的绑定地址，以 `/send` 结尾
  + `NoticeAuthKey`：修改为 `wx-notice` 服务的鉴权字段名
  + `NoticeAuthValue`：修改为 `wx-notice` 服务的鉴权字段值
  + `services`：一般不修改，除非 `wx-notice` 不是默认部署，修改了服务名称或者暴露的RPC调用类名
5. 部署：`npm run deploy`

## 添加邮件路由

在cloudflare的 `电子邮件路由` 中添加 `自定义地址` 并将目标设置为该服务对应的worker。

## 验证

发往 `自定义地址` 的所有邮件都会转发到 `vars.Receiver`，且通知到微信公众号。