console.log(
    '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
)

// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

// =============== Anti-Idle for Douyin Live ===============
(function antiIdleForDouyinLive() {
    console.log('[PakePlus] 抖音直播防暂停功能已启用')

    const simulateActivity = () => {
        const body = document.body
        if (!body) return

        const mouseMove = new MouseEvent("mousemove", { bubbles: true, cancelable: true });
        body.dispatchEvent(mouseMove);

        const click = new MouseEvent("click", { bubbles: true, cancelable: true });
        body.dispatchEvent(click);

        const keydown = new KeyboardEvent("keydown", { key: "Shift", bubbles: true });
        document.dispatchEvent(keydown);
    };

    setInterval(simulateActivity, 60 * 1000); // 每60秒触发一次
})();

// =============== Auto-Set Quality to "原画" ===============
(function autoSetQualityToOriginal() {
    console.log('[PakePlus] 抖音直播自动切换画质功能已启用')

    const trySetQuality = () => {
        // 寻找可能的画质按钮或列表项
        const buttons = document.querySelectorAll('button, div, li, span');

        for (const btn of buttons) {
            if (btn && btn.innerText && btn.innerText.includes('原画')) {
                console.log('[PakePlus] 发现原画按钮，尝试点击', btn);
                btn.click();
                return true;
            }
        }

        return false;
    };

    // 定时多次尝试（防止页面晚加载或路由变化）
    let attemptCount = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
        const success = trySetQuality();
        attemptCount++;

        if (success || attemptCount >= maxAttempts) {
            clearInterval(interval);
            console.log('[PakePlus] 停止自动切换画质扫描');
        }
    }, 2000);
})();
