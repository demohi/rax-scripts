const HTMLAssetPath = 'web/index.html';

module.exports = (config) => {
  config.devServer.set('before', (app, devServer) => {
    const compiler = devServer.compiler.compilers[0];
    const httpResponseQueue = [];
    let fallbackHTMLContent;

    compiler.hooks.emit.tap('AppHistoryFallback', function (compilation) {
      if (compilation.assets[HTMLAssetPath]) {
        fallbackHTMLContent = compilation.assets[HTMLAssetPath].source();
      } else {
        fallbackHTMLContent = 'Document Not Found.';
      }

      let res;
      // eslint-disable-next-line
      while (res = httpResponseQueue.shift()) {
        res.send(fallbackHTMLContent);
      }
    });

    app.get(/^\/?((?!\.(js|html|css|json)).)*$/, function (req, res) {
      if (fallbackHTMLContent !== undefined) {
        res.send(fallbackHTMLContent);
      } else {
        httpResponseQueue.push(res);
      }
    });
  });
};
