console.log(
  '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
  'color:orangered;font-weight:bolder'
);

(function removeWatchlaterPipButtonSmartly() {
    let tryCount = 0;
    const maxTries = 20;
    const interval = 300; // 每300ms尝试一次，总尝试6秒

    const timer = setInterval(() => {
        const el = document.querySelector('.watchlater-pip-button');
        if (el) {
            el.remove();
            console.log('[PakePlus] 已移除稍后再看按钮');
            clearInterval(timer);
        } else if (++tryCount >= maxTries) {
            clearInterval(timer);
            console.log('[PakePlus] 未找到稍后再看按钮，停止尝试');
        }
    }, interval);
})();

// ✅ PakePlus 默认的点击拦截逻辑（保留）
//const hookClick = (e) => {
//  const origin = e.target.closest('a');
//  const isBaseTargetBlank = document.querySelector('head base[target="_blank"]');
//  console.log('origin', origin, isBaseTargetBlank);
//  if (
//    (origin && origin.href && origin.target === '_blank') ||
//    (origin && origin.href && isBaseTargetBlank)
//  ) {
//    e.preventDefault();
//    console.log('handle origin', origin);
//    location.href = origin.href;
//  } else {
//    console.log('not handle origin', origin);
//  }
//};

//document.addEventListener('click', hookClick, { capture: true });

// ✅ 劫持 window.open，强制在当前页打开
try {
  window.open = new Proxy(window.open, {
    apply(target, ctx, args) {
      let [url, targetName = '_blank', features] = args;
      if (typeof url === 'string' && url.startsWith('//')) {
        url = location.protocol + url;
      }
      return Reflect.apply(target, ctx, [url, '_self', features]);
    }
  });
} catch (e) {
  console.error('Error locking window.open:', e);
}

// ✅ 禁止 Ctrl+滚轮 和 手势缩放
window.addEventListener('wheel', e => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });

['gesturestart', 'gesturechange', 'gestureend'].forEach(type => {
  window.addEventListener(type, e => e.preventDefault());
});

// ✅ 移除所有链接的 target="_blank"
const cleanLinks = (root = document) => {
  root.querySelectorAll('a[target="_blank"]').forEach(a => a.removeAttribute('target'));
};
cleanLinks();

// ✅ 设置 MutationObserver 自动清除新生成的 target="_blank"
const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    if (m.type === 'attributes' && m.target.tagName === 'A') {
      m.target.removeAttribute('target');
    } else if (m.addedNodes.length) {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) cleanLinks(node);
      });
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['target']
});



// ✅ 样式修复（防止组件遮挡、统一字体）
const style = document.createElement('style');
style.textContent = `
  html, body { font-family: initial !important; }
  div[data-cy=EvaRenderer_LayerWrapper]:has(.player) { z-index: 999999; }
  .fixedPageBackground_root { z-index: 999999 !important; }
`;
document.head.appendChild(style);

// ✅ 解锁专栏文章的复制权限、屏蔽充电面板
if (location.href.startsWith('https://www.bilibili.com/read/cv')) {
  try {
    if (window.__INITIAL_STATE__?.elecFullInfo) {
      window.__INITIAL_STATE__.elecFullInfo.list = [];
    }
    const holder = document.querySelector('.article-holder');
    if (holder) {
      holder.classList.remove("unable-reprint");
      holder.addEventListener('copy', e => e.stopImmediatePropagation(), true);
    }
  } catch (e) {
    console.error('文章区修改失败:', e);
  }
}

// css filter
document.addEventListener('DOMContentLoaded', () => {
    const targetNode = document.body
    // 配置观察选项
    const config = {
        childList: true,
        subtree: true,
    }
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const element0 = document.querySelector('.watchlater-pip-button');
                if (element0) {
                    element0.style.display = 'none';
                }
            }
        }
    })
    observer.observe(targetNode, config)
})
// end css filter
