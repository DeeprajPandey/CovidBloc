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
    "revision": "b1cd9159d10ceaa0aa20021dd957aa8d"
  },
  {
    "url": "architecture.png",
    "revision": "9a93cf6cea38878e19c5816d1af28b17"
  },
  {
    "url": "assets/css/0.styles.2a1a60fd.css",
    "revision": "8032fa40a42ddbd82f4de0c75292a308"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/10.ba973f27.js",
    "revision": "720a5dd628e46eacbcb976942788095e"
  },
  {
    "url": "assets/js/11.e839d25c.js",
    "revision": "08ea854cc2ec52828b3bf24dc21df3ec"
  },
  {
    "url": "assets/js/12.e6871633.js",
    "revision": "fc19e445083291e79e95f762368d8524"
  },
  {
    "url": "assets/js/13.1d761a31.js",
    "revision": "03b78105f477be033cf65b5f535af904"
  },
  {
    "url": "assets/js/14.52bb9474.js",
    "revision": "5b186b5b6e6c6974e67ccd99551a9f5c"
  },
  {
    "url": "assets/js/15.eee8484b.js",
    "revision": "177bf9471aac5d8ffbb1a378c799c992"
  },
  {
    "url": "assets/js/16.79c66172.js",
    "revision": "e186db1a6a97476e9d3d5f5643637a79"
  },
  {
    "url": "assets/js/2.6ed340d3.js",
    "revision": "01b2a777acda3ead1fb317d4cfbce73f"
  },
  {
    "url": "assets/js/3.d2aac130.js",
    "revision": "80d1396c8f5887484fc4ce218bde8916"
  },
  {
    "url": "assets/js/4.b55e6544.js",
    "revision": "789fbbf63559628bbb968b770720da57"
  },
  {
    "url": "assets/js/5.631bdf95.js",
    "revision": "912101bf2cf83aac3c4f6edaf4d9160b"
  },
  {
    "url": "assets/js/6.f59007da.js",
    "revision": "55669b9045170cf107fcb420aafd6ccf"
  },
  {
    "url": "assets/js/7.f5abcaf9.js",
    "revision": "de43ca7012d0fc9d4554eeae64a96029"
  },
  {
    "url": "assets/js/8.e5f6fdbe.js",
    "revision": "1814b1c0cd120222257afbbaaddd3f5c"
  },
  {
    "url": "assets/js/9.fb13e6b2.js",
    "revision": "030e49e20a90f164274bf575b65e09c0"
  },
  {
    "url": "assets/js/app.10ce02c0.js",
    "revision": "206b1d81678592d3023acea11da6f127"
  },
  {
    "url": "docs/api.html",
    "revision": "58b3d3f2e717b98a99f611d828bd7895"
  },
  {
    "url": "docs/app.html",
    "revision": "52b7bd4926191a3d111c2835bd1f1f0c"
  },
  {
    "url": "docs/chaincode.html",
    "revision": "d1c06caeb7236379bbe2007be0b72b4f"
  },
  {
    "url": "docs/index.html",
    "revision": "9a288802d30bb8beb9416543f14eaded"
  },
  {
    "url": "guide/index.html",
    "revision": "aa747b84a5c69137670206567df6972d"
  },
  {
    "url": "guide/using-vue.html",
    "revision": "a6f4a7d458cb58741e45386680cea8bf"
  },
  {
    "url": "hero.png",
    "revision": "d1fed5cb9d0a4c4269c3bcc4d74d9e64"
  },
  {
    "url": "icons/android-chrome-192x192.png",
    "revision": "f130a0b70e386170cf6f011c0ca8c4f4"
  },
  {
    "url": "icons/android-chrome-512x512.png",
    "revision": "0ff1bc4d14e5c9abcacba7c600d97814"
  },
  {
    "url": "icons/apple-touch-icon-120x120.png",
    "revision": "936d6e411cabd71f0e627011c3f18fe2"
  },
  {
    "url": "icons/apple-touch-icon-152x152.png",
    "revision": "1a034e64d80905128113e5272a5ab95e"
  },
  {
    "url": "icons/apple-touch-icon-180x180.png",
    "revision": "c43cd371a49ee4ca17ab3a60e72bdd51"
  },
  {
    "url": "icons/apple-touch-icon-60x60.png",
    "revision": "9a2b5c0f19de617685b7b5b42464e7db"
  },
  {
    "url": "icons/apple-touch-icon-76x76.png",
    "revision": "af28d69d59284dd202aa55e57227b11b"
  },
  {
    "url": "icons/apple-touch-icon.png",
    "revision": "66830ea6be8e7e94fb55df9f7b778f2e"
  },
  {
    "url": "icons/favicon-16x16.png",
    "revision": "4bb1a55479d61843b89a2fdafa7849b3"
  },
  {
    "url": "icons/favicon-32x32.png",
    "revision": "98b614336d9a12cb3f7bedb001da6fca"
  },
  {
    "url": "icons/msapplication-icon-144x144.png",
    "revision": "b89032a4a5a1879f30ba05a13947f26f"
  },
  {
    "url": "icons/mstile-150x150.png",
    "revision": "058a3335d15a3eb84e7ae3707ba09620"
  },
  {
    "url": "icons/safari-pinned-tab.svg",
    "revision": "f22d501a35a87d9f21701cb031f6ea17"
  },
  {
    "url": "index.html",
    "revision": "4b54cb55364d6147c9ee497cb633a60a"
  },
  {
    "url": "line-numbers-desktop.png",
    "revision": "7c8ccab7c4953ac2fb9e4bc93ecd25ac"
  },
  {
    "url": "line-numbers-mobile.gif",
    "revision": "580b860f45436c9a15a9f3bd036edd97"
  },
  {
    "url": "logo.png",
    "revision": "cf23526f451784ff137f161b8fe18d5a"
  },
  {
    "url": "plugin.png",
    "revision": "3e325210d3e3752e32818385fc4afbc9"
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
