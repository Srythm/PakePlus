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
document.addEventListener('click', hookClick, true)

/**
 * 功能1：监听并关闭【长时间无操作，已暂停播放】弹窗
 */
function autoClosePausePopup() {
    const observer = new MutationObserver(() => {
        const pauseModal = document.querySelector('.modal-content:has(.player_resume)')
        if (pauseModal) {
            console.log('检测到暂停播放弹窗，自动关闭')
            const resumeBtn = pauseModal.querySelector('.player_resume')
            if (resumeBtn) resumeBtn.click()
        }
    })
    observer.observe(document.body, { childList: true, subtree: true })
}
autoClosePausePopup()

/**
 * 功能2：进入直播间后自动切换清晰度为“原画”
 */
function setOriginalQuality() {
    const observer = new MutationObserver(() => {
        const qualityBtn = document.querySelector('.xgplayer-quality .name')
        if (qualityBtn && qualityBtn.textContent !== '原画') {
            console.log('尝试切换清晰度到 原画')
            qualityBtn.click()
            const options = document.querySelectorAll('.xgplayer-quality .xgplayer-list li')
            options.forEach(li => {
                if (li.textContent.includes('原画')) {
                    li.click()
                    console.log('已切换至 原画')
                }
            })
        }
    })
    observer.observe(document.body, { childList: true, subtree: true })
}
setOriginalQuality()
