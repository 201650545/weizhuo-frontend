# 围桌前端开发样板

围桌是面向线下剧本杀的交互式网页样板。这个仓库用于优化人物、礼拜堂建筑、灯光、相机、手机界面和开发调控台。

## 运行

需要 Node.js 18+。在此目录执行：

```sh
node build-prototype.cjs
node usb-room-test.cjs
```

访问 http://127.0.0.1:4388/。中间为手机界面，两侧为开发调控台；齿轮可收起。修改源码后重新构建并刷新。

## 代码入口

- `样板源码/围桌.source.html` 页面结构和样板交互
- `desk-scene3d.js` 圆桌、相机及渲染
- `puppet-model.js`、`refined-puppet.js` 人偶
- `cathedral-room3d.js`、`chapel-*.js`、`window-tracery.js` 建筑、窗、光与室外
- `immersive-scene-hooks.txt`、`immersive-scene-transform.cjs` 入席视角及构建注入
- `unified-prototype.js`、`unified-prototype.css` 页面导航与布局
- `desktop-controller.js` 开发调控台
- `usb-room-client.js` 本地演示房间交互
- `build-prototype.cjs` 构建入口，`围桌样板.html` 为生成结果

## 公开版范围

真实剧本、音乐、凭据、私人状态及授权未明确的图片和材质不包含在此仓库。封面和人偶参考图为纯色占位；音乐开关在没有音频时不可用。4K 材质与角色参考图缺失时对应预览不可用。场景中的程序化人物和建筑源码仍可修改。当前页面使用示意数据，并非完整多人生产服务。

## 优化方向

保留现有交互及测试能力，优先改善人物表现、建筑材质、月光和窗影、界面层次及手机性能。先提供可对比截图，再逐步调整。不要加入密钥或未经授权的内容。
