/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "c6b1b56416cbcfb8433d9267bbd06fcd"
  },
  {
    "url": "assets/css/0.styles.b84f1bf4.css",
    "revision": "ecfbff4901743fad06bdd58a2eb02546"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/10.5d6ee044.js",
    "revision": "5fe0781ed04fb20054c1fcb8b97e85ee"
  },
  {
    "url": "assets/js/11.1b8cfc85.js",
    "revision": "9134b9730e7e8517b8995969447c7f5a"
  },
  {
    "url": "assets/js/12.3a89fa84.js",
    "revision": "99760ebb8981eb30e092930d1ecf7715"
  },
  {
    "url": "assets/js/13.4f743990.js",
    "revision": "a433bc84aca276ed9b348d0ee9a347c6"
  },
  {
    "url": "assets/js/14.32e21054.js",
    "revision": "01d5b7014f3e9a5bc6a4387a3fc7cb33"
  },
  {
    "url": "assets/js/15.d17360c4.js",
    "revision": "3c5caf10155000f68f8c4fc9fcceec9f"
  },
  {
    "url": "assets/js/16.08bb6619.js",
    "revision": "3cf94deec030c63d3ada4707cb6dadbd"
  },
  {
    "url": "assets/js/17.5d3578f0.js",
    "revision": "dc6ab04b689ad5205da7042e1b7b087a"
  },
  {
    "url": "assets/js/2.93d39d28.js",
    "revision": "007ff34ed9b92f8f22451753778794eb"
  },
  {
    "url": "assets/js/3.7ea71a2f.js",
    "revision": "5d711a3c583eb610070ef72d4a90c5ad"
  },
  {
    "url": "assets/js/4.d181edf8.js",
    "revision": "aacaf33e5d8b62a5b49bb5c7c5a31c37"
  },
  {
    "url": "assets/js/5.587e3dbf.js",
    "revision": "63cccd593b98ef5cba3b31fa1a64e7f3"
  },
  {
    "url": "assets/js/6.153cec63.js",
    "revision": "bf8ce043d3cb3ca517309ee201fdb490"
  },
  {
    "url": "assets/js/7.e3d33009.js",
    "revision": "81865cd203de1ae9f9338fa4269b5f0d"
  },
  {
    "url": "assets/js/8.c913edc3.js",
    "revision": "0669d276ee94bbf7c6f0ef71b6b411ee"
  },
  {
    "url": "assets/js/9.cda27e97.js",
    "revision": "4bbddf1430e80a1131f3806ec4eb4080"
  },
  {
    "url": "assets/js/app.40f0fbf6.js",
    "revision": "5cf7bbcb01314682344541d3675406e7"
  },
  {
    "url": "docs/app.html",
    "revision": "384048bef86be2a6a286157329aa1594"
  },
  {
    "url": "docs/chaincode.html",
    "revision": "eebd483c0c856a60965b511de63f9a9d"
  },
  {
    "url": "docs/fabric-ts.html",
    "revision": "2345031f6f0af208b773b164abe8ada4"
  },
  {
    "url": "docs/index.html",
    "revision": "49f32aea9a5e4a4610b2d1d57ad4690e"
  },
  {
    "url": "docs/rest-api.html",
    "revision": "438813641aaaed690d3758c100fa3305"
  },
  {
    "url": "guide/index.html",
    "revision": "9abec9203b804411abb213d345093a6a"
  },
  {
    "url": "guide/using-vue.html",
    "revision": "6779b032a96fe886ec8320be3573b1f3"
  },
  {
    "url": "hero.png",
    "revision": "6980bf2e260e54d1b2a673e52a2d66ed"
  },
  {
    "url": "icons/android-chrome-192x192.png",
    "revision": "b07f268c15d6984ebd5052ae31943147"
  },
  {
    "url": "icons/android-chrome-512x512.png",
    "revision": "6980bf2e260e54d1b2a673e52a2d66ed"
  },
  {
    "url": "icons/apple-touch-icon-120x120.png",
    "revision": "8f823e83cf0f4cac252e5beac0274c82"
  },
  {
    "url": "icons/apple-touch-icon-152x152.png",
    "revision": "80425ecf703e513593c2b30132cc9453"
  },
  {
    "url": "icons/apple-touch-icon-180x180.png",
    "revision": "a348e67fbe4b99989bf4ebd3cb1a99c6"
  },
  {
    "url": "icons/apple-touch-icon-60x60.png",
    "revision": "be63c99197e41574d49eb739b2201eeb"
  },
  {
    "url": "icons/apple-touch-icon-76x76.png",
    "revision": "b5ef88aa33894be7cfd1804a0a0aaaea"
  },
  {
    "url": "icons/apple-touch-icon.png",
    "revision": "6980bf2e260e54d1b2a673e52a2d66ed"
  },
  {
    "url": "icons/favicon-16x16.png",
    "revision": "37c038eab5af1e34d8fcf3f0461ffbf1"
  },
  {
    "url": "icons/favicon-32x32.png",
    "revision": "6d0765616c12e42e7f14d201e1bc5317"
  },
  {
    "url": "icons/msapplication-icon-144x144.png",
    "revision": "accda0a903c8f73143fe11a8b0c460e9"
  },
  {
    "url": "icons/mstile-150x150.png",
    "revision": "64ff00b3acd9327849fd2fd1a05abc5f"
  },
  {
    "url": "icons/safari-pinned-tab.svg",
    "revision": "09d03c1311bcce4032a1e6cca129b2be"
  },
  {
    "url": "index.html",
    "revision": "940c2c0343139ff8dbf351fd34062a64"
  },
  {
    "url": "logo.png",
    "revision": "6980bf2e260e54d1b2a673e52a2d66ed"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
