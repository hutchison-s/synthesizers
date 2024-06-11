(typeof window.addEventListener === `undefined`) && (window.addEventListener = (e, cb) => window.attachEvent(`on${e}`, cb));
window.addEventListener(`contextmenu`, (e) => { e.preventDefault(); });

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
const chance = (arr) => arr[Math.floor(Math.random()*arr.length)]
setTimeout(()=>{select("#welcome").remove()}, 2500)
const fList = [
    65.41,  // C2
    69.30,  // C#2 / Db2
    73.42,  // D2
    77.78,  // D#2 / Eb2
    82.41,  // E2
    87.31,  // F2
    92.50,  // F#2 / Gb2
    49.00,  // G1
    51.91, // G#1 / Ab1
    55.00, // A1
    58.27, // A#1 / Bb1
    61.73, // B1
    130.81, // C3
    138.59, // C#3 / Db3
    146.83, // D3
    155.56, // D#3 / Eb3
    164.81, // E3
    174.61, // F3
    185.00, // F#3 / Gb3
    98.00, // G3
    103.83, // G#3 / Ab3
    110.00, // A3
    116.54, // A#3 / Bb3
    123.47, // B3
  ];
const diatonic = [
    [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23],
    [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22]
]

const keys = {
    'a': {isPressed: false}, 
    'w': {isPressed: false}, 
    's': {isPressed: false},
    'e': {isPressed: false},
    'd': {isPressed: false},
    'f': {isPressed: false},
    't': {isPressed: false},
    'g': {isPressed: false},
    'y': {isPressed: false},
    'h': {isPressed: false},
    'u': {isPressed: false},
    'j': {isPressed: false},
    'k': {isPressed: false},
    'o': {isPressed: false},
    'l': {isPressed: false},
    'p': {isPressed: false},
    ';': {isPressed: false},
    '\'': {isPressed: false},
    "]": {isPressed: false} 
  }

const themes = {
    rock: {
        "--theme-font-color": "#ffffffcc",
        "--theme-accent-color": "rgb(176, 18, 18)",
        "--theme-dark-accent": "rgb(160, 14, 14)",
        "--theme-shadow-color": "#111111aa",
        "--theme-neutral": "#333333"
    },
    marble: {
        "--theme-font-color": "#444444cc",
        "--theme-accent-color": "#91C7B1",
        "--theme-dark-accent": "#4B9578",
        "--theme-shadow-color": "#33333355",
        "--theme-neutral": "#eeeeee"
    },
    sand: {
        "--theme-font-color": "rgb(54, 37, 10)",
        "--theme-accent-color": "rgb(170, 72, 2)",
        "--theme-dark-accent": "#663415",
        "--theme-shadow-color": "#331500aa",
        "--theme-neutral": "#e9c8b3"
    }
}
const octaveMultipliers = [0.25, 0.5, 1, 2, 2+7/12, 3, 3+7/12]
const numPad = [1, 2, 3, 4, 5, 6, 7, 8];
let keyPressed = null;
let tonality = 0;
const countDisplay = select("#count")
const stoneTypes = selectAll(".stoneOpt")
const docRoot = select(":root")
const btns = selectAll(".go")
const voicesInput = select("#voices")
const detuneInput = select("#detune")
const attackInput = select("#attack")
const decayInput = select("#decay")
const sustainInput = select("#sustain")
const releaseInput = select("#release")
const snapInput = select("#snap")
const distortionInput = select("#distortion")
const wobbleInput = select("#wobble")
const wobbleToggle = select("#wobbleToggle")
const wheel = select(".buttonContainer")
const discs = selectAll(".disc")
const keyOpts = selectAll(".keyOpt input")
const envContainer = select("#envelopeContainer")
const mods = select("#modulators")
const tonalities = selectAll("#tonalityBox input")

btns.forEach((b, i) => {
    b.onpointerdown = (e)=>{
        e.preventDefault();

        go(fList[i])
    };
    b.oncontextmenu = (e)=>{
        e.preventDefault()
    }
    b.onpointerup = (e)=>{
        e.preventDefault();
        stop()
    }
    b.onpointerhold = (e)=>{
        e.preventDefault()
    }
})


wobbleToggle.onclick = (e)=>{
    e.target.classList.toggle("wobbling")
}
select("#envelopeToggle").onclick = (e)=>{
    let env = select("#hiddenEnvelope")
    select("#envelopeToggle").innerHTML = env.classList.contains("visible") ? "<i class='far fa-envelope'></i>" : "<i class='fa-regular fa-envelope-open'></i>"
    env.classList.toggle("visible")
}
select("#carrierToggle").onclick = (e)=>{
    select("#hiddenCarrier").classList.toggle("visible")
}
select("#mod1Toggle").onclick = (e)=>{
    select("#hiddenMod1").classList.toggle("visible")
}
select("#mod2Toggle").onclick = (e)=>{
    select("#hiddenMod2").classList.toggle("visible")
}
selectAll("button.left").forEach(btn => {
    btn.addEventListener("click", () => {
        let waveType = btn.parentNode.querySelector(".waveType")
        let currentWave = waveType.textContent;
        switch (currentWave) {
            case "sine":
                waveType.textContent = "sawtooth"
                break;
            case "sawtooth":
                waveType.textContent = "triangle"
                break;
            case "triangle":
                waveType.textContent = "square"
                break;
            default:
                waveType.textContent = "sine"
        }
    })
})
selectAll("button.right").forEach(btn => {
    btn.addEventListener("click", () => {
        let waveType = btn.parentNode.querySelector(".waveType")
        let currentWave = waveType.textContent;
        switch (currentWave) {
            case "sine":
                waveType.textContent = "square"
                break;
            case "sawtooth":
                waveType.textContent = "sine"
                break;
            case "triangle":
                waveType.textContent = "sawtooth"
                break;
            default:
                waveType.textContent = "triangle"
        }
    })
})

tonalities.forEach(ton => {
    ton.addEventListener("change", ()=>{
        if (ton.checked) {
            tonality = ton.value
        }
        changeKey(keyOpts.indexOf(keyOpts.filter(x=>x.checked)[0]))
    })
})

stoneTypes.forEach(opt => {
    opt.addEventListener("change", ()=>{
        if (opt.checked) {
            document.body.style.backgroundImage = "url("+opt.getAttribute("data-bg")+")"
            for (let key of Object.keys(themes[opt.id])) {
                docRoot.style.setProperty(key, themes[opt.id][key])
            }
            for (let b of btns) {
                b.style.backgroundImage = "url("+opt.getAttribute("data-btn-bg")+")"
            }
            switch (opt.id) {
                case "rock":
                    go = rockSynth;
                    filterSettings("reese")

                    mods.style.display = "none"
                    envContainer.style.display = "block"

                    break;
                case "marble":
                    go = marbleSynth;
                    filterSettings("808")

                    mods.style.display = "none"
                    envContainer.style.display = "block"

                    break;
                default:
                    go = sandSynth;
                    filterSettings("FM")
                    mods.style.display = "block"
                    envContainer.style.display = "block"
                    releaseInput.value = 0.02

            }
        }
    })
})


window.addEventListener("keyup", (e)=>{
    if (keys[e.key]) {
        console.log(Object.entries(keys).filter((k, v)=>k!=e.key))
      if (Object.entries(keys).filter(x=>x[0]!=e.key).every(x=>!x[1].isPressed)) {
        
        stop()
      }
      keys[e.key].isPressed = false;
    }
  })
  window.addEventListener("keydown", (e)=>{
    if (keys[e.key]) {
        if (!keys[e.key]?.isPressed) {
            keys[e.key].isPressed = true;
            let freq = fList[Object.keys(keys).indexOf(e.key)];
            go(freq);
        }
    }
    
  })

function filterSettings(term) {
    for (const lbl of select("#generalSettings").children) {
        if (lbl.classList.contains(term)) {
            lbl.style.display = "grid"
        } else {
            lbl.style.display = "none"
        }
    }
}

// rotate stones around circle

for (let i=0; i<discs.length; i++) {
    discs[i].style.transform = `rotate(${i*(360/14)}deg)`
}

// change key and adjust visibility of diatonic notes

keyOpts.forEach((opt, idx) => {
    opt.addEventListener("change", (e)=>{
        let start;
        if (opt.checked) {
            wheel.style.rotate = opt.value+"deg"
            start = idx
            changeKey(start)
        }
    })
})

function changeKey(start) {
    const thisKey = diatonic[tonality].map(x=>x+start > 23 ? x+start-24 : x+start)
    for (const [i, b] of btns.entries()) {
        let adjustedIdx = i+start > 23 ? i+start-24 : i+start
        if (thisKey.includes(adjustedIdx)) {
            btns[adjustedIdx].classList.remove("chromatic")
        } else {
            btns[adjustedIdx].classList.add("chromatic")
        }
    }
}
// display current range input settings
selectAll("#inputs input[type='range']").forEach(i => {
    i.addEventListener("input", (e)=> {
        count.classList.add("visible")
        count.textContent = i.value
    })
    i.addEventListener("pointerup", (e)=>{
        count.classList.remove("visible")
    })
    
})


const ac = new AudioContext()

// Meters
const preFader = ac.createAnalyser()
const postFader = ac.createAnalyser()
postFader.connect(ac.destination)

// Master Gain
const masterLevel = ac.createGain()
masterLevel.gain.value = 0.7;
const volumeInput = select("#volume")
volumeInput.oninput = (e)=>{
    masterLevel.gain.value = e.target.value
}
masterLevel.connect(postFader)

// Master Compressor
const masterCompressor = ac.createDynamicsCompressor()
masterCompressor.threshold.value = -12;
masterCompressor.ratio.value = 6;
const masterLimiter = ac.createDynamicsCompressor()
masterLimiter.threshold.value = -2;
masterLimiter.ratio.value = 12;
preFader.connect(masterCompressor)
masterCompressor.connect(masterLimiter)
masterLimiter.connect(masterLevel)

// Low Pass Filter
const lowPassFilter = ac.createBiquadFilter()
lowPassFilter.type = "lowpass";
lowPassFilter.frequency.value = 4000;
lowPassFilter.Q.value = 2;
lowPassFilter.connect(preFader)
const lowpassInput = select("#lowpass")
lowpassInput.addEventListener("input", (e)=>{
    lowPassFilter.frequency.value = e.target.value
})

const getADSR = () => [parseFloat(attackInput.value), parseFloat(sustainInput.value), parseFloat(decayInput.value), parseFloat(releaseInput.value)]
const getModADSR = (mod) => [
    parseFloat(select(`#${mod}attack`).value),
    parseFloat(select(`#${mod}decay`).value),
    parseFloat(select(`#${mod}sustain`).value),
    parseFloat(select(`#${mod}release`).value),
]
// Reese Bass Synth

function rockSynth(freq) {
    clearActive()

    
    let totalVoices = parseInt(voicesInput.value);
    let detuneIncrement = detuneInput.value / totalVoices
    for (let idx = 0; idx < voicesInput.value; idx++) {
        let o = ac.createOscillator()
        let g = ac.createGain()
        const [a, d, s, r] = getADSR()
        ads(g.gain, 1/totalVoices, [a, d, 1/totalVoices])
        o.frequency.value = freq
        o.type = 'square'
        if (voicesInput.value > 1) {
            let p = ac.createStereoPanner()
            if (idx == voicesInput.value - 1 && voicesInput.value % 2 == 1) {
                p.pan.value = 0;
            } else {
                p.pan.value = idx % 2 == 1 ? 0.5 : -0.5
            }
            g.connect(p)
            p.connect(lowPassFilter)
        } else {
            g.connect(lowPassFilter)
        }
        let plusMinus = idx % 2 == 1 ? 1 : -1
        o.detune.value = (plusMinus * idx * detuneIncrement)+((Math.random()*8)-4)
        o.connect(g)
        o.start()
        active.push({o: o, g: g})
    }
}

// 808 Bass Synth
function marbleSynth(freq) {
    clearActive()

    // Oscillator
    let o = ac.createOscillator()
    let g = ac.createGain()
    const [a, d, s, r] = getADSR()
    ads(g.gain, 1, [a, d, s])
    o.frequency.value = freq
    o.type = 'sine'
    o.start()
    
    // Snap
    adsr(o.detune, snapInput.value*3600, [0.009, 0, 0, 0.03])

    // Distortion
    let distortionNode = ac.createWaveShaper()
    distortionNode.curve = createDistortionCurve(distortionInput.value*50, ac.sampleRate)
    
    // Signal Flow
    o.connect(g)
    o.connect(distortionNode)
    distortionNode.connect(g)
    g.connect(lowPassFilter)

    active.push({o: o, g: g})
}

// FM Bass Synth
function sandSynth(freq) {
    clearActive()

    // Carrier Oscillator
    let o = ac.createOscillator()
    let g = ac.createGain()
    ads(g.gain, 1, [0.01, 0.1, 0.9])
    o.frequency.value = freq
    o.type = select("#carrierType").textContent
    o.start()

    // Wobble with compression
    if (wobbleToggle.classList.contains("wobbling")) {
        let subGain = ac.createGain()
        subGain.connect(g)
        let lfo = ac.createOscillator()
        lfo.frequency.value = parseFloat(wobbleInput.value);
        let lfoGain = ac.createGain()
        lfo.connect(lfoGain)
        lfoGain.gain.value = 0.6
        lfo.start()
        o.connect(subGain)
        lfoGain.connect(subGain.gain)
        let comp = ac.createDynamicsCompressor()
        comp.ratio.value = 20;
        comp.threshold.value = -5;
        g.connect(comp)
        comp.connect(lowPassFilter)
    } else {
        o.connect(g)
        g.connect(lowPassFilter)
    }

    // Operator 1 with envelope
    let op1 = ac.createOscillator()
    const op1env = getModADSR("mod1")
    op1.frequency.value = freq*parseInt(select("#mod1freq").value);
    op1.type = select("#mod1Type").textContent;
    let op1Gain = ac.createGain()
    adsr(op1Gain.gain, select("#mod1gain").value*2000, op1env)
    op1.start();

    // Operator 2 with envelope
    let op2 = ac.createOscillator()
    const op2env = getModADSR("mod2")
    op2.frequency.value = freq*parseInt(select("#mod2freq").value);
    op2.type = select("#mod2Type").textContent;
    let op2Gain = ac.createGain()
    adsr(op2Gain.gain, select("#mod2gain").value*2000, op2env)
    op2.start();

    // Signal flow
    let destination = selectAll("#modConnectorBox input")[0].checked ? o.frequency : op1.frequency
    op1.connect(op1Gain)
    op1Gain.connect(o.frequency)
    op2.connect(op2Gain)
    op2Gain.connect(destination)
    
    active.push({o: o, g: g})
}

const active = []
const finished = []


let go = rockSynth;
select("#rock").click()

function clearActive() {
    for (let i=0; i<active.length; i++) {
        let now = ac.currentTime
        let x = active.pop()
        x.g.gain.cancelScheduledValues(now)
        x.g.gain.setTargetAtTime(0, now, 0.01)
        x.o.stop(now+0.05)
    }
}

function stop() {
    let now = ac.currentTime;
    for (const each of active) {
        let {o, g} = each;
            g.gain.cancelScheduledValues(0);
            g.gain.setTargetAtTime(0, now, parseFloat(releaseInput.value))
    }

}

// from chat GPT about distortion curves using sigmoid functions

function createDistortionCurve(amount, samples) {
    var curve = new Float32Array(samples);
    var deg = Math.PI / 180;
  
    for (var i = 0; i < samples; ++i) {
      var x = i * 2 / samples - 1;
      curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
    }
  
    return curve;
  }
  
  function adsr(node, lvl, [a, d, s, r]) {
    let now = ac.currentTime
    node.setValueAtTime(0, now)
    node.setTargetAtTime(lvl, now, a)
    node.setTargetAtTime(s*lvl, now+a, d)
    node.setTargetAtTime(0, now+a+d, r)
  }

  function ads(node, lvl, [a, d, s]) {
    let now = ac.currentTime
    node.setValueAtTime(0, now)
    node.setTargetAtTime(lvl, now, a)
    node.setTargetAtTime(s*lvl, now+a, d)
  }
  
  setInterval(()=>{
    select("#preFader").style.height = `${dBToPercentage(getPeakDecibelLevel(preFader)).toFixed(2)}%`
    select("#postFader").style.height = `${dBToPercentage(getPeakDecibelLevel(postFader)).toFixed(2)}%`
  }, 10)



  // from ChatGPT!!!!
  function getPeakDecibelLevel(analyzerNode) {
    // Check if the analyzerNode is valid
    if (!analyzerNode || !(analyzerNode instanceof AnalyserNode)) {
      console.error("Invalid AnalyzerNode");
      return null;
    }
  
    // Set the size of the FFT (Fast Fourier Transform) to determine the frequency resolution
    const fftSize = 2048; // You can adjust this based on your needs
  
    // Set up the AnalyzerNode
    analyzerNode.fftSize = fftSize;
    const bufferLength = analyzerNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
  
    // Get the peak decibel level
    analyzerNode.getFloatTimeDomainData(dataArray);
    let sumOfSquares = 0;
  
    for (let i = 0; i < bufferLength; i++) {
      sumOfSquares += dataArray[i] ** 2
    }
    const avgPowerDecibels = 10 * Math.log10(sumOfSquares / dataArray.length);
  
    return avgPowerDecibels;
  }

  function dBToPercentage(dBValue, maxdB = 0) {
    // Calculate linear scale
    const linearValue = Math.pow(10, dBValue / 20);

    // Map linear scale to percentage
    const percentage = (linearValue / Math.pow(10, maxdB / 20)) * 100;

    // Ensure the percentage is within the range [0, 100]
    return Math.max(0, Math.min(100, percentage));
}