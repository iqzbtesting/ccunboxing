// ==UserScript==
// @name         Brute Force Spinning + Toast Toggle + Smart Auto Smash
// @namespace    http://tampermonkey.net/
// @version      2024-04-24
// @description  brute spin + hide spam + smart auto smash newly added cubes under a value
// @author       IQZB
// @match        https://cubecollector.net/*
// @grant        none
// ==/UserScript==

(function () {
    const panel = document.createElement('div')
    panel.style.position = 'fixed'
    panel.style.top = '100px'
    panel.style.left = '100px'
    panel.style.width = '220px'
    panel.style.padding = '12px'
    panel.style.background = `
        url(https://cubecollector.net/BGS/newnavbg.png) repeat,
        linear-gradient(90deg, var(--backgroundcolor, #0f0f0f) 40%, rgba(5, 5, 5, 0.7) 100%)`
    panel.style.backgroundBlendMode = 'multiply'
    panel.style.opacity = '0.95'
    panel.style.transform = 'translateZ(0)'
    panel.style.border = '2px solid #1e1e1e'
    panel.style.borderRadius = '12px'
    panel.style.zIndex = '999999'
    panel.style.cursor = 'move'
    panel.style.boxShadow = '0 0 12px rgba(0,0,0,0.6)'
    panel.style.fontFamily = 'sans-serif'
    panel.style.userSelect = 'none'
    panel.style.color = '#c2c2c2'

    const title = document.createElement('div')
    title.innerText = 'OP Unboxing Script'
    title.style.textAlign = 'center'
    title.style.marginBottom = '12px'
    title.style.fontWeight = '600'
    title.style.fontSize = '16px'
    title.style.color = '#c2c2c2'

    const sectionTitle = (label) => {
        const el = document.createElement('div')
        el.innerText = label
        el.style.textAlign = 'center'
        el.style.margin = '10px 0 6px'
        el.style.fontSize = '14px'
        el.style.fontWeight = '600'
        el.style.borderBottom = '1px solid #2a2a2a'
        el.style.paddingBottom = '3px'
        return el
    }

    const group = (...elements) => {
        const wrapper = document.createElement('div')
        wrapper.style.marginBottom = '10px'
        elements.forEach(el => wrapper.appendChild(el))
        return wrapper
    }

    const createButton = (label) => {
        const btn = document.createElement('button')
        btn.innerText = label
        btn.style.width = '100%'
        btn.style.padding = '7px 0'
        btn.style.marginBottom = '5px'
        btn.style.border = '1px solid #333'
        btn.style.borderRadius = '6px'
        btn.style.background = '#1a1a1a'
        btn.style.cursor = 'pointer'
        btn.style.color = '#c2c2c2'
        btn.style.fontWeight = '500'
        return btn
    }

    const startBtn = createButton('Start')
    const stopBtn = createButton('Stop')
    const toggleNotifBtn = createButton('Turn Off Notifications')
    const toggleSmashBtn = createButton('Enable Auto Smash')

    const smashInput = document.createElement('input')
    smashInput.type = 'number'
    smashInput.placeholder = 'Smash < Qubits'
    smashInput.value = '7000'
    smashInput.style.display = 'block'
    smashInput.style.width = '100%'
    smashInput.style.padding = '7px 0'
    smashInput.style.marginBottom = '5px'
    smashInput.style.borderRadius = '6px'
    smashInput.style.border = '1px solid #333'
    smashInput.style.background = '#1a1a1a'
    smashInput.style.color = '#ccc'
    smashInput.style.textAlign = 'center'
    smashInput.style.fontWeight = '500'
    

    panel.appendChild(title)
    panel.appendChild(sectionTitle('Halfspin'))
    panel.appendChild(group(startBtn, stopBtn))
    panel.appendChild(sectionTitle('Others'))
    panel.appendChild(group(toggleNotifBtn))
    panel.appendChild(sectionTitle('Auto Smash'))
    panel.appendChild(group(smashInput))
    panel.appendChild(group(toggleSmashBtn))
    document.body.appendChild(panel)

    let interval = null
    let toastBlockerEnabled = true
    let smashEnabled = false
    let isSmashing = false
    const seenInventory = {}

    const parsePrice = (text) => {
        const cleaned = text.replace(/[Ϙ,]/g, '').toLowerCase().trim()
        if (cleaned.includes('m')) return parseFloat(cleaned.replace('m', '')) * 1_000_000
        if (cleaned.includes('k')) return parseFloat(cleaned.replace('k', '')) * 1_000
        return parseFloat(cleaned)
    }

    const getCubeKey = (cube) => {
        const name = cube.querySelector('.inventoryitemname span')?.innerText || '???'
        const priceText = cube.querySelector('.itemprice')?.innerText || ''
        const price = parsePrice(priceText)
        return `${name}::${price}`
    }

    const getCubeQty = (cube) => {
        const qtyText = cube.querySelector('.cubestackquantity, .itemtally, .itemprefixcount')?.innerText || 'x1'
        const match = qtyText.match(/\d+/)
        return match ? parseInt(match[0]) : 1
    }

    const scanInitialInventory = () => {
        const cubes = document.querySelectorAll('#inventory .itemcontainer')
        cubes.forEach(cube => {
            const key = getCubeKey(cube)
            const qty = getCubeQty(cube)
            seenInventory[key] = (seenInventory[key] || 0) + qty
        })
    }

    scanInitialInventory()

    startBtn.onclick = () => {
        if (interval) return
        interval = setInterval(() => {
            const spin = document.getElementById("spincubebutton")
            if (spin) spin.click()
        }, 100)
    }

    stopBtn.onclick = () => {
        clearInterval(interval)
        interval = null
    }

    toggleNotifBtn.onclick = () => {
        toastBlockerEnabled = !toastBlockerEnabled
        toggleNotifBtn.innerText = toastBlockerEnabled ? 'Turn Off Notifications' : 'Turn On Notifications'
    }

    toggleSmashBtn.onclick = () => {
        smashEnabled = !smashEnabled
        toggleSmashBtn.innerText = smashEnabled ? 'Disable Auto Smash' : 'Enable Auto Smash'
    }

    setInterval(() => {
        if (!toastBlockerEnabled) return
        const toastContainer = document.querySelector('.toastnotifications')
        if (toastContainer) {
            toastContainer.querySelectorAll('.toastnotification:not(.iqzb-toast)').forEach(el => {
                el.style.display = 'none'
            })
        }
    }, 100)

    setInterval(() => {
        if (!smashEnabled || isSmashing) return
        const cubes = document.querySelectorAll('#inventory .itemcontainer')
        const threshold = parseFloat(smashInput.value)
        if (isNaN(threshold)) return

        for (const cube of cubes) {
            const key = getCubeKey(cube)
            const price = parseFloat(key.split('::')[1])
            if (price > threshold) continue
            const qty = getCubeQty(cube)
            const baseQty = seenInventory[key] || 0
            if (qty > baseQty) {
                seenInventory[key] = baseQty + 1
                isSmashing = true
                const rightClick = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 2
                })
                cube.dispatchEvent(rightClick)
                setTimeout(() => {
                    const contextMenu = document.getElementById('contextmenu')
                    if (!contextMenu) return isSmashing = false
                    const options = Array.from(contextMenu.querySelectorAll('.contextmenuitemcontent'))
                    const stackSmash = options.find(opt => opt.textContent.toLowerCase().includes('smash entire stack'))
                    const singleSmash = options.find(opt => opt.textContent.toLowerCase().includes('smash cube'))
                    if (stackSmash) stackSmash.click()
                    else if (singleSmash) singleSmash.click()
                    setTimeout(() => {
                        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
                        isSmashing = false
                    }, 400)
                }, 150)
                break
            }
        }
    }, 500)

    let isDragging = false, offsetX, offsetY
    panel.addEventListener('mousedown', (e) => {
        isDragging = true
        offsetX = e.clientX - panel.getBoundingClientRect().left
        offsetY = e.clientY - panel.getBoundingClientRect().top
    })

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`
            panel.style.top = `${e.clientY - offsetY}px`
        }
    })

    document.addEventListener('mouseup', () => {
        isDragging = false
    })

    const addCustomToast = () => {
        const toastContainer = document.querySelector('.toastnotifications')
        if (!toastContainer) return
        if (document.querySelector('.iqzb-toast')) return
        const customToast = document.createElement('div')
        customToast.className = 'toastnotification error iqzb-toast'
        customToast.style.color = 'var(--messageerror)'
        customToast.style.marginTop = '5px'
        const toastHeader = document.createElement('div')
        toastHeader.className = 'toastnotifheader'
        toastHeader.innerHTML = `<span class="material-symbols-outlined" style="color: var(--messageerror);">dns</span> Script Info:`
        const toastBody = document.createElement('div')
        toastBody.className = 'toastnotifbody'
        toastBody.innerText = 'Iqzb made this script, W him'
        customToast.appendChild(toastHeader)
        customToast.appendChild(toastBody)
        toastContainer.appendChild(customToast)
    }

    setInterval(addCustomToast, 1000)
})()
