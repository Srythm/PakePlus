(function () {
  'use strict';

  const CONFIG = {
    OBSERVER_THROTTLE: 100,
    LOCK_INTERVAL: 5000,        // 从 150ms 提升到 5s，避免频繁执行
    SHADOW_DEPTH: 3
  };

  // 强制 window.open 打开当前页
  const lockWindowOpen = () => {
    try {
      if (window.open.toString().includes('Proxy')) return; // 避免重复代理
      window.open = new Proxy(window.open, {
        apply(target, ctx, args) {
          let [url, targetName = '_self', features] = args;
          if (typeof url === 'string' && url.startsWith('//')) {
            url = location.protocol + url;
          }
          return Reflect.apply(target, ctx, [url, targetName, features]);
        }
      });
    } catch (e) {
      console.error('Error locking window.open:', e);
    }
  };

  // 清除 a[target="_blank"]（迭代版，防止栈溢出）
  const fastCleanLinks = (root, maxDepth = CONFIG.SHADOW_DEPTH) => {
    const stack = [{ node: root, depth: 0 }];
    const visited = new WeakSet(); // 防止重复访问 shadowRoot

    while (stack.length > 0) {
      const { node, depth } = stack.pop();

      if (!node || visited.has(node)) continue;
      visited.add(node);

      try {
        // 清理当前作用域下的 _blank 链接（排除搜索框链接）
        const links = node.querySelectorAll?.('a[target="_blank"]:not(#search-box-link)');
        if (links) {
          links.forEach(a => {
            try {
              a.removeAttribute('target');
            } catch (e) {
              console.debug('Failed to remove target:', a, e);
            }
          });
        }

        // 递归处理 Shadow DOM（限制深度）
        if (depth < maxDepth) {
          const children = node.querySelectorAll?.('*') || [];
          // 逆序 push，保证遍历顺序接近原顺序
          for (let i = children.length - 1; i >= 0; i--) {
            const el = children[i];
            if (el.shadowRoot) {
              stack.push({ node: el.shadowRoot, depth: depth + 1 });
            }
          }
        }
      } catch (e) {
        console.warn('Error processing node in fastCleanLinks:', e);
      }
    }
  };

  // 节流函数（带 trailing，防止遗漏最后一次调用）
  function throttle(fn, wait) {
    let timeout = null;
    let lastArgs = null;

    const run = () => {
      if (lastArgs) {
        fn.apply(null, lastArgs);
        lastArgs = null;
        timeout = setTimeout(run, wait);
      } else {
        timeout = null;
      }
    };

    return function (...args) {
      lastArgs = args;
      if (!timeout) {
        timeout = setTimeout(run, wait);
      }
    };
  }

  // DOM 变化队列处理
  let mutationQueue = [];
  const processMutations = () => {
    mutationQueue.forEach(mutation => {
      const target = mutation.target;
      if (mutation.type === 'attributes') {
        if (target instanceof HTMLElement && target.hasAttribute('target') && !target.matches('#search-box-link')) {
          target.removeAttribute('target');
        }
      } else if (target instanceof Element) {
        fastCleanLinks(target);
      }
    });
    mutationQueue = [];
  };

  const throttledProcess = throttle(processMutations, CONFIG.OBSERVER_THROTTLE);

  // 启动 MutationObserver
  const observer = new MutationObserver(mutations => {
    mutationQueue.push(...mutations);
    throttledProcess();
  });

  function observeDOM() {
    const target = document.documentElement || document.body;
    if (!target) return;

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['target']
    });

    // 初始清理
    fastCleanLinks(target);
  }

  // 拦截点击行为（仅针对 target="_blank" 的链接）
  document.addEventListener('click', e => {
    // 忽略右键、Ctrl/Command+点击、Shift+点击
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;

    // 只处理 target="_blank" 的 <a> 标签
    const anchor = e.composedPath().find(el => {
      return el instanceof HTMLAnchorElement && el.target === '_blank';
    });

    if (!anchor) return; // 非 _blank 链接，放行

    // 排除特殊情况
    if (
      anchor.getAttribute('role') === 'button' ||
      anchor.onclick ||
      anchor.href.startsWith('javascript:') ||
      anchor.id === 'search-box-link'
    ) {
      return; // 放行，由原逻辑处理
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const url = anchor.href.startsWith('//')
      ? location.protocol + anchor.href
      : anchor.href;

    location.assign(url);
  }, true); // 使用捕获阶段，尽早拦截

  // 禁用 Ctrl+滚轮缩放
  window.addEventListener('wheel', e => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  // 禁用手势缩放（移动端）
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(type => {
    window.addEventListener(type, e => e.preventDefault());
  });

  // 全局字体注入
  const TARGET_FONT = 'Microsoft Yahei, Helvetica Neue, Helvetica, Arial, Hiragino Sans GB, Heiti SC, Malgun Gothic, sans-serif';

  function injectGlobalFontStyle() {
    if (document.getElementById('custom-global-font-style')) return;
    const style = document.createElement('style');
    style.id = 'custom-global-font-style';
    style.textContent = `
      body, body * {
        font-family: ${TARGET_FONT} !important;
      }
    `.trim();
    document.head.appendChild(style);
  }

  // 拦截 history 操作，重新注入字体和清理链接
  function hookFontStyleReinjection() {
    const reapply = () => {
      injectGlobalFontStyle();
      fastCleanLinks(document.documentElement);
    };

    // 使用 Proxy 代理，避免破坏原函数
    history.pushState = new Proxy(history.pushState, {
      apply: (target, thisArg, args) => {
        const result = Reflect.apply(target, thisArg, args);
        reapply();
        return result;
      }
    });

    history.replaceState = new Proxy(history.replaceState, {
      apply: (target, thisArg, args) => {
        const result = Reflect.apply(target, thisArg, args);
        reapply();
        return result;
      }
    });

    window.addEventListener('popstate', reapply);
    reapply(); // 初始执行一次
  }

  // 初始化
  (function init() {
    lockWindowOpen();
    injectGlobalFontStyle();
    observeDOM();
    hookFontStyleReinjection();

    // 页面加载后清理一次
    const cleanup = () => fastCleanLinks(document.body);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cleanup);
    } else {
      cleanup();
    }
  })();

  // 定时保险机制（降低频率）
  const defenseTimer = setInterval(() => {
    lockWindowOpen();
    fastCleanLinks(document.documentElement);
  }, CONFIG.LOCK_INTERVAL);

  // 页面卸载时清理定时器
  window.addEventListener('unload', () => {
    clearInterval(defenseTimer);
    observer.disconnect();
  });

})();