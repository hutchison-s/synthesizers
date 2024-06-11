// DOM Manipulation shortcuts
const elem = (q) => document.getElementById(q);
const elems = (q) => Array.from(document.querySelectorAll(q));
const makeEl = (type) => document.createElement(type);
setTimeout(()=>{elem("welcome").remove()}, 3000)

// DOM Elements
const volumeInput = elem("volume")
const octaveDown = elem("octaveDown")
const octaveUp = elem("octaveUp")
const chordsEl = elem("chords");
const optionsEl = elem("options");
const touchPad = elem("touchPad");
const point = elem("point");
const lock = elem("touchLock");
const knobs = elems(".knob");
const key = elem("keyChoice");
const ton = elem("tonality");
const enharmonic = elem("enharmonic");
const patternToggle = elem("patternToggle");
const beats = elems(".beatCheck");
const beatMarks = elems(".beatMark");
const pulseLight = elem("pulseLight");
const lessTempo = elem("lessTempo");
const moreTempo = elem("moreTempo");
const tempoSpan = elem("tempo");
const tempoBox = elem("tempoBox");
const tempoBig = elem("tempoBig");

// Constant variables
const major = [0, 9, 17, 20, 30, 37, 47];
const minor = [1, 11, 12, 21, 29, 32, 42];
const scaleRoot = 0;
const notes = [
  { name: ["C", "C"], freq: 261.63 },
  { name: ["C#", "Db"], freq: 277.18 },
  { name: ["D", "D"], freq: 293.66 },
  { name: ["D#", "Eb"], freq: 311.13 },
  { name: ["E", "E"], freq: 329.63 },
  { name: ["F", "F"], freq: 349.23 },
  { name: ["F#", "Gb"], freq: 369.99 },
  { name: ["G", "G"], freq: 392.0 },
  { name: ["G#", "Ab"], freq: 415.3 },
  { name: ["A", "A"], freq: 440.0 },
  { name: ["A#", "Bb"], freq: 466.16 },
  { name: ["B", "B"], freq: 493.88 },
];
const qualityRatios = {
  M7: [0.5, 5 / 4, 3 / 4, 15 / 16],
  m7: [0.5, 6 / 5, 3 / 4, 8 / 9],
  Dom7: [0.5, 5 / 4, 3 / 4, 8 / 9],
  dim7: [0.5, 6 / 5, 32 / 45, 8 / 9],
};
const scaleDegrees = ["i", "ii", "iii", "iv", "v", "vi", "vii"];
const numPad = ["1", "2", "3", "4", "5", "6", "7"];
const octaveMultiples = [0.5, 1, 2];

// State variables
let attack = 0.25;
let decay = 0.1;
let sustain = 0.1;
let release = 0.25;
let tempo = 100;
let tonality = "maj";
let xPos = null;
let yPos = null;
let knobY = null;
let tempoInterval = null;
let isMouseDown = false;
let isTouchingKnob = false;
let isTouchingTempo = false;
let isLocked = false;
let octave = 1;
const oscArray = [];
const gainArray = [];

// Audio Context Setup
const ac = new AudioContext();
const lowPass = ac.createBiquadFilter();
const pulse = ac.createGain();
const highpass = ac.createBiquadFilter();
const globalLevel = ac.createGain();
globalLevel.gain.value = 0.8;
lowPass.type = "lowpass";
lowPass.frequency.value = 50;
lowPass.connect(highpass);
highpass.type = "highpass";
highpass.frequency.value = 100;
highpass.connect(pulse)
pulse.connect(globalLevel);
globalLevel.connect(ac.destination);

// Populate chord grid in DOM
createRows();
const chords = elems(".chordInput");
chords[0].checked = true;

// Initialize gain envelope
setEnvelope();

// Add event listeners to DOM elements
touchPad.addEventListener("touchstart", handleTouchPadStart);
touchPad.addEventListener("mousedown", handleTouchPadStart);
touchPad.addEventListener("touchmove", handleTouchPadMove);
touchPad.addEventListener("mousemove", handleTouchPadMove);
touchPad.addEventListener("touchend", handleTouchPadEnd);
touchPad.addEventListener("mouseup", handleTouchPadEnd);
touchPad.addEventListener("mouseleave", handleTouchPadEnd);
lock.addEventListener("pointerup", (e)=>{
  e.preventDefault()
  isLocked = !isLocked;
  lock.classList.toggle("locked");
  if (!isLocked) {
    handleTouchPadEnd(new Event("click"))
  }
})

knobs.forEach((knob) => {
  knob.addEventListener("touchstart", handleKnobStart);
  knob.addEventListener("mousedown", handleKnobStart);
  knob.addEventListener("touchmove", handleKnobMove);
  knob.addEventListener("mousemove", handleKnobMove);
  knob.addEventListener("touchend", handleKnobEnd);
  knob.addEventListener("mouseup", handleKnobEnd);
  knob.addEventListener("mouseleave", handleKnobEnd);
});
key.addEventListener("input", keyChange);
ton.addEventListener("input", keyChange);
enharmonic.addEventListener("input", updateRows);
patternToggle.addEventListener("input", handlePatternToggle);
moreTempo.addEventListener("click", ()=>handleTempoChange("up"));
lessTempo.addEventListener("click", ()=>handleTempoChange("down"));
tempoSpan.addEventListener("touchstart", handleTempoTouch);
tempoSpan.addEventListener("mousedown", handleTempoTouch);
tempoBox.addEventListener("touchmove", handleTempoMove);
tempoBox.addEventListener("mousemove", handleTempoMove);
tempoBox.addEventListener("touchend", handleTempoRelease);
tempoBox.addEventListener("mouseup", handleTempoRelease);
tempoBox.addEventListener("mouseleave", handleTempoRelease);
octaveUp.addEventListener("click", ()=>handleOctaveClick("up"))
octaveDown.addEventListener("click", ()=>handleOctaveClick("down"))
volumeInput.addEventListener("input", (e)=>{
  globalLevel.gain.value = volumeInput.value
})

window.addEventListener("keyup", (e)=>{
  for (let i = 0; i < numPad.length; i++) {
    // Find out if a number between 1-7 was pressed, and if so act on that number's index in numPad
    if (e.key == numPad[i]) {
      // Find the chord button with the pressed scale degree class and make it checked if it exists
      let chordPressed = document.querySelector("."+scaleDegrees[i]);
      if (chordPressed) {
        chordPressed.checked = true;
        // If mouse is down (sound is currently playing), change the active chord to this one 
        if (isMouseDown) {
          // Collect frequencies from value property and parse into floats
          const values = chordPressed.value.split(",");
          const frequencies = values.map(n=>parseFloat(n))
          // Slide frequencies of each oscillator in the main array to frequencies collected
          for (let i = 0; i < oscArray.length; i++) {
            oscArray[i].frequency.setTargetAtTime(frequencies[i] * octaveMultiples[octave], ac.currentTime, 0.005);
          }
        }
      }
    }
  }
  if (e.key == "+") {
    octaveUp.click()
  } else if (e.key == "-") {
    octaveDown.click()
  }
})




// Event listener functions

function handleTempoChange(direction) {
  if (direction === "up") {
    tempo++;
  } else if (direction == "down") {
    tempo--;
  }
  if (tempoInterval) {
    clearInterval(tempoInterval);
    setNewTempoInterval();
  }
}

function handleOctaveClick(direction) {
  if (direction === "up" && octave < 2) {
    octave++;
  } else if (direction === "down" && octave > 0) {
    octave--;
  }

  octaveUp.disabled = (octave === 2);
  octaveDown.disabled = (octave === 0);
}


function handleTempoTouch(e) {
  e.preventDefault();
  isTouchingTempo = true;
  let contact = e.type == "mousedown" ? e : e.targetTouches[0];
  xPos = contact.clientX;
  tempoBig.style.display = "block";
}

function handleTempoMove(e) {
  e.preventDefault();
  let contact = e.type == "mousemove" ? e : e.targetTouches[0];
  let x = contact.clientX;
  if (isTouchingTempo) {
    if (tempo < 200 && xPos - x < 0) {
      tempo++
    } else if (tempo > 40 && xPos - x > 0) {
      tempo--
    }
    xPos = x;
  }
  tempoBig.innerHTML = tempo;
  tempoSpan.innerHTML = tempo;
}

function handleTempoRelease(e) {
  e.preventDefault();
  isTouchingTempo = false;
  if (tempoInterval) {
    clearInterval(tempoInterval);
    setNewTempoInterval();
  }
  tempoBig.style.display = "none";
}

function handlePatternToggle(e) {
  if (e.target.checked) {
    pulse.gain.value = 0;
    setNewTempoInterval();
    beats.forEach((x) => {
      x.disabled = false;
    });
    beatMarks.forEach((x) => {
      x.style.borderColor = "var(--tea-green)";
    });
  } else {
    clearInterval(tempoInterval);
    tempoInterval = null;
    pulse.gain.value = 1;
    beats.forEach((x) => {
      x.disabled = true;
    });
    beatMarks.forEach((x) => {
      x.style.borderColor = "#000000aa";
    });
  }
}

function handleTouchPadStart(e) {
  e.preventDefault();

  // If the point on the touchpad was not the "lock" icon
  if (!isMouseDown && e.target != lock) {

    // Get touch point for mouse and touch events
    let contact = e.type == "mousedown" ? e : e.targetTouches[0];

    // Set global state
    isMouseDown = true;

    // Determine how far and in which direction off-center the pointer event occurred
    let midX = touchPad.offsetLeft + touchPad.offsetWidth / 2;
    xPos = contact.clientX;
    yPos = contact.clientY;
    let xOffset = (midX - xPos) * -1;

    // Set visual touchpoint glow element to visible and move to pointer location
    point.classList.add("active");
    point.style.left = xPos - touchPad.offsetLeft + "px";
    point.style.top = yPos - touchPad.offsetTop + "px";

    // Get chord button element that is currently checked and retrieve frequencies from value property
    const selectedChord = document.querySelector(".chordInput:checked");
    const values = selectedChord.value.split(",");
    const frequencies = values.map((n) => Number(n));
    
    // Make sure element exists
    if (selectedChord) {
      
      // Determine vertical offset and adjust lowpass filter frequency
      let yMax = touchPad.offsetTop + touchPad.offsetHeight;
      lowPass.frequency.value = Number(
        (((yMax - yPos) / touchPad.offsetHeight) * 8000).toFixed(3)
      );
      
      // Create oscillators and gain nodes from frequencies and add to global arrays
      soundChord(frequencies);

      // Calculate how many cents to bend pitch based on pointer event distance from center and edges on X axis
      let cents = Math.round((xOffset / touchPad.offsetWidth) * 200);


      // ENVELOPE
      let now = ac.currentTime;
      for (let i = 0; i < gainArray.length; i++) {
      
        // If pointer event is offcenter by more than 20 pixels, pitch bend each oscillator that much
        if (Math.abs(xOffset) > 20) {
          oscArray[i].detune.setValueAtTime(cents, now);
        }
        // Ramp up to gain of 0.2 (remember there are 4 notes sounding which compound) after the 'attack' amount of time
        gainArray[i].gain.setTargetAtTime(0.2, now, attack);

        // Ramp gain down to the 'sustain' gain level at the 'decay' amount of time
        gainArray[i].gain.setTargetAtTime(sustain/4, now + attack, decay);
      }
    }
  }
}

function handleTouchPadMove(e) {
  e.preventDefault();
  if (!isLocked) {
    let contact = e.type == "mousemove" ? e : e.targetTouches[0];
    if (isMouseDown) {
      let midX = touchPad.offsetLeft + touchPad.offsetWidth / 2;
      let pad = 0;
      let x = contact.clientX;
      let y = contact.clientY;
      let xOffset = (midX - xPos) * -1;
      let xMin = touchPad.offsetLeft + pad;
      let xMax = touchPad.offsetLeft + touchPad.offsetWidth - pad;
      let yMin = touchPad.offsetTop + pad;
      let yMax = touchPad.offsetTop + touchPad.offsetHeight - pad;
      if (x < xMax && x > xMin) {
        point.style.left = x - touchPad.offsetLeft + "px";
        for (let o of oscArray) {
          let cents = Math.round((xOffset / touchPad.offsetWidth) * 200);
          o.detune.setValueAtTime(cents, ac.currentTime);
        }
      }
      if (y < yMax && y > yMin) {
        point.style.top = y - touchPad.offsetTop + "px";
        lowPass.frequency.setTargetAtTime(
          Number((((yMax - y) / touchPad.offsetHeight) * 8000).toFixed(3)),
          ac.currentTime,
          0
        );
      }
      xPos = x;
      yPos = y;
    }
  }
  
}

const adsr = {
  get0: ()=>attack,
  get1: ()=>decay,
  get2: ()=>sustain,
  get3: ()=>release
}

function handleTouchPadEnd(e) {
  e.preventDefault();
  if (!isLocked) {
    isMouseDown = false;
    let now = ac.currentTime;
    point.classList.remove("active");
    while (oscArray.length > 0) {
      gainArray[0].gain.cancelScheduledValues(now);
      gainArray[0].gain.setTargetAtTime(0, now, release);
      oscArray[0].stop(now + release + 1);
      gainArray.shift();
      oscArray.shift();
    }
  }
  
}

function handleKnobStart(e) {
  let currentTarget = e.target.classList.contains("knobMark") ? e.target.parentNode : e.target
  e.preventDefault();
  let idx = knobs.indexOf(currentTarget)
  let contact = e.type == "mousedown" ? e : e.touches[0];
  knobY = contact.clientY;
  isTouchingKnob = true;
  currentTarget.classList.add("active");
  currentTarget.parentNode.querySelector(".knobDisplay").textContent = adsr["get"+idx]()
}
function handleKnobMove(e) {
  e.preventDefault();
  let currentTarget = e.target.classList.contains("knobMark") ? e.target.parentNode : e.target
  if (isTouchingKnob) {
    let idx = knobs.indexOf(currentTarget)
    let contact = e.type == "mousemove" ? e : e.touches[0];
    let y = contact.clientY;
    let yDelta = knobY - y;
    let currentRotation = parseInt(currentTarget.getAttribute("data-rotation")) || 0;
    if (currentRotation + yDelta > -135 && currentRotation + yDelta < 135) {
      currentTarget.setAttribute("data-rotation", currentRotation + yDelta);
      currentTarget.style.transform = `rotate(${currentRotation + yDelta}deg)`;
      knobY = y;
    }
    setEnvelope();
    currentTarget.parentNode.querySelector(".knobDisplay").textContent = adsr["get"+idx]()
  }
}

function handleKnobEnd(e) {
  e.preventDefault();
  let currentTarget = e.target.classList.contains("knobMark") ? e.target.parentNode : e.target
  currentTarget.classList.remove("active");
  isTouchingKnob = false;
}

function keyChange() {
  const thisTonality = ton.value == "maj" ? major : minor;
  if (key.value != "") {
    const thisKey = thisTonality.map((x) => {
      let n = x + parseInt(key.value);
      n = n > 47 ? n - 48 : n;
      return n;
    });
    chords.forEach((c, i) => {
      c.classList.remove("inKey");
      c.classList.remove("notInKey");
      for (let degree of scaleDegrees) {
        c.classList.remove(degree)
      }
      if (thisKey.includes(i)) {
        let degreeIdx = i < key.value ? (i + 48) - key.value : i - key.value;
        let deg = thisTonality.indexOf(degreeIdx)
        c.classList.add("inKey");
        c.classList.add(scaleDegrees[deg])
      } else {
        c.classList.add("notInKey");
      }
    });
  } else {
    chords.forEach((c) => {
      c.classList.remove("inKey");
      c.classList.remove("notInKey");
      for (let degree of scaleDegrees) {
        c.classList.remove(degree)
      }
    });
  }
}

// DOM Population Functions

let activePlan = null;

function createRows() {
  chordsEl.innerHTML = "";
  const planBlock = makeEl("div")
  planBlock.id = "planBlock"
  let planToggle = makeEl("div")
  planToggle.id = "planToggle"
  planToggle.textContent = "Show Plan"
  planToggle.classList.add("tiny")
  planBlock.appendChild(planToggle)
  planToggle.addEventListener("click", ()=>{
    elems("#planBlock div").forEach(x => {
      if (x != planToggle) {
        x.classList.toggle("hidden")
      } else {
        x.classList.toggle("tiny")
        x.textContent = x.classList.contains("tiny") ? "Show Plan" : "Hide"
      }
    })
  })
  let clearPlan = makeEl("div")
  clearPlan.id = "clearPlan"
  clearPlan.textContent = "Clear"
  clearPlan.classList.add("hidden")
  planBlock.appendChild(clearPlan)
  clearPlan.addEventListener("click", ()=>{
    elems(".planChord").sort((a, b)=>a.textContent - b.textContent).forEach(ch => {
        planBlock.appendChild(ch)
        ch.classList.remove("active")
    })
  })
  for (let i = 1; i<9; i++) {
    let chordNum = makeEl("div")
    chordNum.textContent = i
    chordNum.id = "plan"+i
    chordNum.classList.add("planChord")
    chordNum.classList.add("hidden")
    chordNum.onclick = (e)=>{
      if (!activePlan) {
        e.target.classList.add("active")
        activePlan = e.target
      } else {
        elems("#planBlock div.active").forEach(block => {
          block.classList.remove("active")
        })
        activePlan = null;
      }
      
    }
    planBlock.appendChild(chordNum)
  }
  chordsEl.appendChild(planBlock)
  let nameIdx = enharmonic.checked ? 0 : 1;
  notes.forEach((note) => {
    const chordBlock = makeEl("div");
    chordBlock.classList.add("chordRow");
    chordBlock.innerHTML = `<span>${note.name[nameIdx]}</span>`;
    for (let k of Object.keys(qualityRatios)) {
      const btn = makeEl("label");
      btn.setAttribute("for", note.name[nameIdx] + k);
      let input = `
        <input 
          type='radio' 
          id='${note.name[nameIdx] + k}' 
          class='chordInput' 
          name='chordSelect' 
          value=${getFreqs(note.freq, k)} 
        />`;
      btn.innerHTML = k;
      btn.innerHTML += input;
      btn.classList.add("chordBtn");
      btn.addEventListener("pointerdown", (e) => {
        if (activePlan) {
          btn.appendChild(activePlan)
          elems(".planChord.active").forEach(ch => {ch.classList.remove("active")})
          activePlan = null;
        }
        btn.querySelector("input").checked = true;
        if (isMouseDown) {
          const fs = getFreqs(note.freq, k);
          for (let i = 0; i < oscArray.length; i++) {
            oscArray[i].frequency.setTargetAtTime(fs[i]*octaveMultiples[octave], ac.currentTime, 0.005);
          }
          console.log(oscArray)
        }
      });
      chordBlock.appendChild(btn);
    }
    chordsEl.appendChild(chordBlock);
  });
}

function updateRows() {
  let nameIdx = enharmonic.checked ? 0 : 1;
  const labels = elems(".chordRow span");
  const options = elems("#keyChoice option");
  let selected = key.value;
  keyChoice.innerHTML = "<option value=''>All</option>";
  for (let i = 0; i < labels.length; i++) {
    let name = notes[Object.keys(notes)[i]].name[nameIdx];
    labels[i].innerHTML = name;
    keyChoice.innerHTML += `<option value=${i * 4}>${name}</option>`;
  }
  key.value = selected;
}

// Utility & Calculation Functions

function getFreqs(root, quality) {
  return qualityRatios[quality].map(n => Number((root * n).toFixed(3)));
}

function setNewTempoInterval() {
  const measure = Math.round((60 / (tempo * 2)) * 1000);
  let i = 1;
  
  let measureCount = 0;
  const gainPulse = () => {
    let now = ac.currentTime;
    pulse.gain.setTargetAtTime(2, now, attack);
    pulse.gain.setTargetAtTime(0, now + attack + decay, release);
  };
  tempoInterval = setInterval(() => {
    const planned = elems(".chordBtn .planChord").sort((a,b)=>a.textContent-b.textContent)
    if (i==1 && planned.length > 0) {
      planned[measureCount].parentNode.querySelector("input").checked = true;
      if (isMouseDown) {
        const fs = planned[measureCount].parentNode.querySelector("input").value.split(",").map(x=>parseFloat(x));
        for (let i = 0; i < oscArray.length; i++) {
          oscArray[i].frequency.setTargetAtTime(fs[i]*octaveMultiples[octave], ac.currentTime, 0.005);
        }
        console.log(oscArray)
      }
      measureCount = measureCount < planned.length-1 ? measureCount+1 : 0
    }
    if (i % 2 == 1) {
      pulseLight.style.background = "var(--orangepeel)";
      setTimeout(() => {
        pulseLight.style.background = "initial";
      }, 50);
    }
    let prevMark = beatMarks[i - 2] || beatMarks[7];
    prevMark.style.borderColor = "var(--tea-green)";
    beatMarks[i - 1].style.borderColor = "#ffffff";
    if (beats.every((x) => !x.checked)) {
      pulse.gain.value = 1;
    } else {
      if (beats[i - 1].checked && isMouseDown) {
        gainPulse();
      }
    }
    i = i > 7 ? 1 : i + 1;
  }, measure);
}

// Accepts an array of frequencies and creates oscillator and gain nodes and connects them to signal flow
function soundChord(fArray) {
  let now = ac.currentTime;
  fArray.forEach((f) => {
    // Create oscillator node with global state wave type and this iteration's frequency
    const o = ac.createOscillator();
    const waveType = document.querySelector(".waveOpt:checked");
    o.type = waveType.value || "sine";
    o.frequency.value = f * octaveMultiples[octave];

    // Create gain node for this oscillator with initial level of 0 (silent)
    const g = ac.createGain();
    g.gain.setValueAtTime(0, now);

    // Setup signal from from oscillator to gain node to global Low Pass Filter
    o.connect(g);
    g.connect(lowPass);

    // Add the nodes to the global active array
    oscArray.push(o);
    gainArray.push(g);

    // Start the oscillator
    o.start(now);
  });
}

function setEnvelope() {
  attack = Number(
    ((parseInt(knobs[0].getAttribute("data-rotation")) + 135) / 270).toFixed(2)
  );
  decay = Number(
    ((parseInt(knobs[1].getAttribute("data-rotation")) + 135) / 270).toFixed(2)
  );
  sustain = Number(
    ((parseInt(knobs[2].getAttribute("data-rotation")) + 135) / 270).toFixed(2)
  );
  release = Number(
    ((parseInt(knobs[3].getAttribute("data-rotation")) + 135) / 270).toFixed(2)
  );
}
