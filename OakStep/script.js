const select = (selector)=>document.querySelector(selector);
const selectAll = (selector)=>Array.from(document.querySelectorAll(selector));
const makeEl = (type, id = null, cl = null, text=null, attr={}) => {
    const el = document.createElement(type);
    if (id) {el.id = id}
    if (cl) {el.classList.add(cl)}
    if (text) {el.innerHTML = text}
    for (const key in attr) {
        const value = attr[key];
        el.setAttribute(key, value)
    }
    return el
}
setTimeout(()=>{select("#welcome").remove()}, 2500)
const tempoInput = select("#tempo");
const swingInput = select("#swing");
const volumeInput = select("#volume");
const meterInput = select("#meter");
const divisionInput = select("#division");
const playBtn = select("#playBtn");
const dialog = select("#settingsDialog");
const closeDialog = select("#closeDialog");
const dialogInputs = select("#dialogInputs");
const playIcon = '<i class="fa-regular fa-circle-play"></i>';
const stopIcon = '<i class="fa-solid fa-circle-stop"></i>';
let ac = new AudioContext()
const gainNode = ac.createGain()
gainNode.connect(ac.destination)
let tempo = tempoInput.value;
let volume = volumeInput.value;
let isPlaying = false;
let playInterval = null;
const tracks = [];
let trackElements;

const initialSounds = [
    [
        "./sounds/kit1/Kick Cobalt 1.wav",
        "./sounds/kit1/Snare Cobalt 1.wav",
        "./sounds/kit1/ClosedHH Cobalt.wav",
        "./sounds/kit1/OpenHH Cobalt.wav",
        "./sounds/kit1/Tom Graphite 2.wav",
        "./sounds/kit1/Crash Cobalt.wav",
        "./sounds/kit1/Scratch Chomp.wav"
    ],
    [
        "./sounds/kit2/Kick Analie.wav",
        "./sounds/kit2/Snare Cracked 1.wav",
        "./sounds/kit2/ClosedHH Analie 1.wav",
        "./sounds/kit2/OpenHH Analie.wav",
        "./sounds/kit2/Tom Analie 2.wav",
        "./sounds/kit2/Tom Analie 4.wav",
        "./sounds/kit2/Crash Redmenn.wav",
    ],
    [
        "./sounds/kit3/Kick Haerkla 1.wav",
        "./sounds/kit3/Snare Haerkla 1 V1.wav",
        "./sounds/kit3/Snare Haerkla 2.wav",
        "./sounds/kit3/Clap Haerkla.wav",
        "./sounds/kit3/ClosedHH Haerkla 1.wav",
        "./sounds/kit3/OpenHH Haerkla.wav",
        "./sounds/kit3/Ride Amsterdam.wav",
    ]
]

const metersObject = {
    fourfour: {steps: ()=>4*divisionInput.value, emphasis: ()=>divisionInput.value},
    threefour: {steps: ()=>3*divisionInput.value, emphasis: ()=>divisionInput.value},
    twofour: {steps: ()=>2*divisionInput.value, emphasis: ()=>divisionInput.value},
    twelveeight: {steps: ()=>6*divisionInput.value, emphasis: ()=>divisionInput.value == 4 ? 6 : 3},
    nineeight: {steps: ()=>4.5*divisionInput.value, emphasis: ()=>divisionInput.value == 4 ? 6 : 3},
    sixeight: {steps: ()=>3*divisionInput.value, emphasis: ()=>divisionInput.value == 4 ? 6 : 3}
}

class Track {
    constructor(element, isNew) {
        this.element = element;
        this.name = element.querySelector(".trackTitle");
        this.loader = element.querySelector(".loadSound");
        this.gear = element.querySelector(".gear");
        this.muteBtn = element.querySelector(".mute");
        this.rec = element.querySelector(".recordButton")
        this.steps = element.querySelectorAll(".stepInput");
        this.source = null;
        this.muted = false;
        this.level = 0.8;
        this.detune = 0;
        this.pan = 0;
        this.filterType = "highpass";
        this.filterFreq = 10000;
        this.isFiltering = false;
        if (isNew) {
            this.localSource(initialSounds[currentKit][trackElements.indexOf(element)])
        }
        this.muteBtn.addEventListener("click", ()=>{
            this.muted = !this.muted;
            this.muteBtn.classList.toggle("muted")
        })
        this.loader.addEventListener("input", (e)=>{
            let file = e.target.files[0]
            this.fileSource(file)
            this.name.textContent = file.name.length > 16 ? file.name.substring(0, 12)+"..." : file.name
        })
        this.gear.addEventListener("click", ()=>{
            makeDialog(this)
            dialog.showModal()
        })
        this.rec.addEventListener("click", ()=>{
            makeRecordingDialog(this)
            dialog.showModal()
        })
    }
    resetTrack() {
        this.muted = false;
        this.level = 0.8;
        this.detune = 0;
        this.pan = 0;
        this.filterType = "highpass";
        this.filterFreq = 10000;
        this.isFiltering = false;
    }
    localSource(path) {
        fetch(path).then(data=>data.blob()).then(file => {
            const reader = new FileReader()
            reader.onload = (e)=>{
                const audioData = e.target.result

                ac.decodeAudioData(audioData, (buffer)=>{
                    this.setSource(buffer)
                })
            }
            reader.readAsArrayBuffer(file)
        })
    }
    fileSource(file) {
        const reader = new FileReader()
        reader.onload = (e)=>{
            const audioData = e.target.result
            ac.decodeAudioData(audioData, (buffer)=>{
                this.setSource(buffer)
            })
        }
        reader.readAsArrayBuffer(file)
    }
    setSource(src) {
        this.source = src
    }
}

let currentKit = 0

function fillSteps() {
    playBtn.innerHTML = playIcon;
    stopPlaying();
    isPlaying = false;
    let isFirstTime = trackElements == undefined;
    const panel = select("#instrumentPanel")
    panel.innerHTML = '';
    let boxNum = 0;
    console.log(`filling steps for ${meterInput.value} meter with ${divisionInput.value} divisions`)
    for (let i = 0; i < 7; i++) {
        const element = makeEl("article", `track${i+1}`, "track")
        element.innerHTML += `
        <h2 class="trackTitle" contenteditable="true">${initialSounds[currentKit][i].split("/")[3].slice(0, -4)}</h2>
        <div class="trackSettings" data-src=${tracks[i] && JSON.stringify(tracks[i].source)}>
            <button class="recordButton"><i class="fa-solid fa-microphone"></i></button>
            <label for="file${i+1}"><i class="fa-solid fa-folder-plus"></i><input type="file" name="" id="file${i+1}" class="loadSound"></label>
            <button class="gear"><i class="fa-solid fa-gear"></i></button>
            <button class="mute"><i class="fa-solid fa-volume-xmark"></i></i></button>
        </div>`
        const div = makeEl("div", null, "steps")
        for (let s = 0; s < metersObject[meterInput.value].steps(); s++, boxNum++) {
            div.innerHTML+=`
            <label for="box${boxNum}" class="step"><input type="checkbox" name="" id="box${boxNum}" class="stepInput"></label>`       
        }
        element.appendChild(div)
        panel.appendChild(element)
    }
    let loadKitBox = makeEl("div", "loadKitBox")
    loadKitBox.innerHTML = `
        <select id="kitSelect">
            <option value=0 selected="selected">Kit 1</option>
            <option value=1>Kit 2</option>
            <option value=2>Kit 3</option>
        </select>
    `
    let loadBtn = makeEl("button", "loadKit")
    loadBtn.innerHTML = `<i class="fa-regular fa-folder-open"></i>`
    loadKitBox.appendChild(loadBtn)
    panel.appendChild(loadKitBox)
    select("#kitSelect").addEventListener("change", (e)=>{
        currentKit = e.target.value
    })
    loadBtn.addEventListener("click", ()=>{
        for (const [i, t] of tracks.entries()) {
            t.localSource(initialSounds[currentKit][i])
            t.name.textContent = initialSounds[currentKit][i].split("/")[3].slice(0, -4)
            t.resetTrack()
        }
    })
    selectAll(`.step:nth-child(${metersObject[meterInput.value].emphasis()}n+1)`).forEach(x => {
        x.style.borderColor = "var(--pnk)"
    })
    const oldTracks = [...tracks]
    const oldSources = []
    for (let t of oldTracks) {
        oldSources.push(t.source)
    }
    tracks.length = 0;
    trackElements = selectAll(".track");
    for (const t of trackElements) {
        if (isFirstTime) {
            tracks.push(new Track(t, true));
        } else {
            tracks.push(new Track(t, false))
        }
    }
    if (oldTracks.length != 0) {
            for (let i=0; i<tracks.length; i++) {
                tracks[i].source = oldSources[i] // NEEDS to be set after track constructor promises resolve
                if (oldTracks[i].muted) {tracks[i].muteBtn.click()}
                tracks[i].level = oldTracks[i].level;
                tracks[i].detune = oldTracks[i].detune;
                tracks[i].pan = oldTracks[i].pan;
                tracks[i].name.textContent = oldTracks[i].name.textContent;
                tracks[i].filterType = oldTracks[i].filterType;
                tracks[i].filterFreq = oldTracks[i].filterFreq;
                tracks[i].isFiltering = oldTracks[i].isFiltering;
            }
        
    }
    
}

fillSteps()

tempoInput.addEventListener("input", (e)=>{
    tempo = e.target.value
})
volumeInput.addEventListener("input", (e)=>{
    volume = e.target.value
    gainNode.gain.value = volume
})
closeDialog.addEventListener("click", (e)=>{
    dialog.close()
    dialogInputs.innerHTML = ''
})
meterInput.addEventListener("change", ()=>{
    console.log("meter changed to", meterInput.value)
    fillSteps()
    const compound = ["sixeight", "nineeight", "twelveeight"]
    if (compound.some(x=>x==meterInput.value)) {
        swingInput.setAttribute("disabled", true)
    } else {
        swingInput.removeAttribute("disabled")
    }
})
divisionInput.addEventListener("change", ()=>{
    console.log("beat subdivision changed to", divisionInput.value)
    fillSteps()
})



const fillSettings = (target) => `
<h3 id="dialogTitle">${target.name.textContent}</h3>
<form onsubmit="(e)=>{e.preventDefault()}" id="trackSettingsForm">
<div class="verticalFaders">
    <label for="trackLevel"><div class="touchDisplay"></div>Level<input id="trackLevel" name="trackLevel" type="range" min="0" max="1" step="0.01" value=${target.level}></label>
    <label for="trackDetune"><div class="touchDisplay"></div>Detune<input id="trackDetune" name="trackDetune" type="range" min="-2400" max="2400" step="100" value=${target.detune}></label>
</div>
    <label for="trackPan"><div class="touchDisplay"></div>Pan<input id="trackPan" name="trackPan" type="range" min="-1" max="1" step="0.01" value=${target.pan}></label>
    <label for="filterToggle">EQ Filter<input id="filterToggle" name="filterToggle" type="checkbox" ${target.isFiltering && "checked"}></label>
    <div id="filterOptions">
        <label for="hpf">
            <img src="./highpass.png" alt="HPF" width="40px">
            <input id="hpf" name="trackFilter" value="highpass" type="radio" hidden ${target.filterType == "highpass" && "checked"} ${!target.isFiltering && "disabled"}>
        </label>
        <label for="lpf">
            <img src="./highpass.png" alt="LPF" width="40px" style="transform: scaleX(-1)">
            <input id="lpf" name="trackFilter" value="lowpass" type="radio" hidden ${target.filterType == "lowpass" && "checked"} ${!target.isFiltering && "disabled"}>
        </label>
        <label for="filterFreq"><div class="touchDisplay"></div>Frequency<input id="filterFreq" name="filterFreq" type="range" min="0" max="20000" step="1" value=${target.filterFreq} ${!target.isFiltering && "disabled"}></label>
    </div>
</form>
`
function trimSilence(buffer, threshold) {
    let nonSilentStart = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < buffer.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
            nonSilentStart = Math.max(nonSilentStart, i);
            break;
            }
        }
    }
    const newBuffer = ac.createBuffer(
        buffer.numberOfChannels,
        buffer.length - nonSilentStart,
        buffer.sampleRate
    );
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const newChannelData = newBuffer.getChannelData(channel);
        for (let i = nonSilentStart, j = 0; i < buffer.length; i++, j++) {
            newChannelData[j] = channelData[i]
        }
    }
    return newBuffer
}
const makeRecordingDialog = (target) => {
    const recBtn = makeEl("button", "record", null, "Click to Record Sound")
    const recBox = makeEl("div", "recBox")
    dialogInputs.appendChild(recBtn)
    dialogInputs.appendChild(recBox)
    let isRecording = false;
    let src;
    let blob;
    const confirmBox = makeEl("div", "confirmBox")
    const keep = makeEl("button", "keepRec", null, "Keep")
    const discard = makeEl("button", "discardRec", null, "Discard")
    confirmBox.appendChild(keep)
    confirmBox.appendChild(discard)
    keep.addEventListener("click", ()=>{
        const reader = new FileReader()
        reader.onload = () => {
            ac.decodeAudioData(reader.result, (buffer)=>{
                const trimmedBuffer = trimSilence(buffer, 0.1)
                target.source = trimmedBuffer
            })
        }
        reader.readAsArrayBuffer(blob)
        dialogInputs.innerHTML = ''
        dialog.close()
    })
    discard.addEventListener("click", ()=>{
        recBox.innerHTML = ''
        recBtn.removeAttribute("disabled")
        recBtn.textContent = "Click to Record Sound";
    })
    recBtn.addEventListener("click", ()=>{
        if (!isRecording && recBox.children.length == 0) {
            navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                src = new MediaRecorder(stream)
                src.ondataavailable = (e) => {
                    let audio = makeEl("audio");
                    blob = e.data;
                    audio.src = window.URL.createObjectURL(blob)
                    audio.setAttribute("controls", true)
                    recBox.appendChild(audio)
                    recBox.appendChild(confirmBox)
                    }
                src.start()    
            })
            isRecording = true
            recBtn.textContent = 'Stop Recording'
        } else {
            if (src) {
                src.stop()
                isRecording = false
                recBtn.setAttribute("disabled", true)
            }
        }
        
    })
}

const makeDialog = (target) => {
    dialogInputs.innerHTML = fillSettings(target)
    const {trackLevel, trackPan, trackDetune, filterToggle, filterFreq} = select("#trackSettingsForm")
    const hpf = select("#hpf")
    const lpf = select("#lpf")
    trackLevel.addEventListener("input", (e) => {
        target.level = e.target.value
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.innerHTML = Math.round(e.target.value*100)+"%"
    })
    trackLevel.addEventListener("pointerdown", (e) => {
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.classList.add("isTouching")
        display.innerHTML = Math.round(e.target.value*100)+"%"
    })
    trackLevel.addEventListener("pointerup", (e) => {
        e.target.parentNode.querySelector(".touchDisplay").classList.remove("isTouching")
    })
    trackDetune.addEventListener("input", (e) => {
        target.detune = e.target.value
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.innerHTML = Math.round(e.target.value/100)+" steps"
    })
    trackDetune.addEventListener("pointerdown", (e) => {
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.classList.add("isTouching")
        display.innerHTML = Math.round(e.target.value/100)+" steps"
    })
    trackDetune.addEventListener("pointerup", (e) => {
        e.target.parentNode.querySelector(".touchDisplay").classList.remove("isTouching")
    })
    trackPan.addEventListener("input", (e) => {
        target.pan = e.target.value
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.innerHTML = Math.round(Math.abs(e.target.value*100))+"%"
        if (e.target.value != 0) {
            display.innerHTML += e.target.value > 0 ? " Right" : " Left"
        }
    })
    trackPan.addEventListener("pointerdown", (e) => {
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.classList.add("isTouching")
        display.innerHTML = Math.round(Math.abs(e.target.value*100))+"%"
        if (e.target.value != 0) {
            display.innerHTML += e.target.value > 0 ? " Right" : " Left"
        }
    })
    trackPan.addEventListener("pointerup", (e) => {
        e.target.parentNode.querySelector(".touchDisplay").classList.remove("isTouching")
    })
    hpf.addEventListener("change", (e) => {
        target.filterType = select("#trackSettingsForm").trackFilter.value
    })
    lpf.addEventListener("change", (e) => {
        target.filterType = select("#trackSettingsForm").trackFilter.value
    })
    filterFreq.addEventListener("input", (e) => {
        target.filterFreq = e.target.value
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.innerHTML = e.target.value+" Hz"
    })
    filterFreq.addEventListener("pointerdown", (e) => {
        let display = e.target.parentNode.querySelector(".touchDisplay")
        display.classList.add("isTouching")
        display.innerHTML = e.target.value+" Hz"
    })
    filterFreq.addEventListener("pointerup", (e) => {
        e.target.parentNode.querySelector(".touchDisplay").classList.remove("isTouching")
    })
    filterToggle.addEventListener("input", (e) => {
        target.isFiltering = e.target.checked
        if (e.target.checked) {
            hpf.removeAttribute("disabled")
            lpf.removeAttribute("disabled")
            filterFreq.removeAttribute("disabled")
        } else {
            hpf.setAttribute("disabled", true)
            lpf.setAttribute("disabled", true)
            filterFreq.setAttribute("disabled", true)
        }
    })
}



playBtn.addEventListener("click", handlePlayClick)

function handlePlayClick() {
    if (isPlaying) {
        playBtn.innerHTML = playIcon;
        stopPlaying();
        console.log("stopped")
    } else {
        playBtn.innerHTML = stopIcon;
        startPlaying();
        console.log("playing")
    }
    isPlaying = !isPlaying;
}

function startPlaying() {
    let sixteenth = Math.round(15000/tempo);
    let eighth = Math.round(30000/tempo);
    let division = divisionInput.value == 4 ? sixteenth : eighth;
    let idx = 0;
    playInterval = setInterval(()=>{
        let prev = idx == 0 ? tracks[0].steps.length-1 : idx-1;
        for (let t of tracks) {
            t.steps[idx].parentNode.classList.add("here")
            t.steps[prev].parentNode.classList.remove("here")
            if (t.steps[idx].checked && !t.muted) {
                const sound = ac.createBufferSource()
                sound.buffer = t.source
                sound.detune.value = t.detune
                const level = ac.createGain()
                level.gain.value = t.level
                const panner = ac.createStereoPanner()
                panner.pan.value = t.pan
                const filter = ac.createBiquadFilter()
                filter.type = t.filterType
                filter.frequency.value = t.filterFreq
                sound.connect(level)
                level.connect(panner)
                if (t.isFiltering) {
                    panner.connect(filter)
                    filter.connect(gainNode)
                } else {
                    panner.connect(gainNode)
                }
                let now = ac.currentTime
                let delay = swingInput.checked && idx % 2 == 1 ? parseFloat(((division/3)*0.001).toFixed(2)) : 0;
                sound.start(now+delay)
                sound.stop(now+1)
            }
        }
        idx = idx < tracks[0].steps.length-1 ? idx+1 : 0
    }, division)
    
}

function stopPlaying() {
    clearInterval(playInterval)
    for (const b of selectAll(".here")) {
        b.classList.remove("here")
    }
}