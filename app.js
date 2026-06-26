// Mapare pentru selectia din Mixer
const synthMap = {
  rain: playRain,
  wind: playWind,
  thunder: playThunder,
  snow: playSnow,
  sword: playSword,
  explosion: playExplosion,
  magic: playMagic,
  fire: playFire,
  forest: playForest,
  cave: playCave,
  ocean: playOcean,
};

// Referinte pentru sunetele active
let activeRain = null;
let activeWind = null;
let activeThunder = null;
let activeSnow = null;
let activeFire = null;
let activeForest = null;
let activeCave = null;
let activeOcean = null;
let activeMixerInstruments = [];

// Setup Visualizer
const canvas = document.getElementById("visualizer");
const canvasCtx = canvas.getContext("2d");
const analyser = new Tone.Analyser("fft", 256);
Tone.getDestination().connect(analyser);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  const buffer = analyser.getValue();
  const width = canvas.width;
  const height = canvas.height;

  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.fillStyle = "#07080c";
  canvasCtx.fillRect(0, 0, width, height);

  const barWidth = (width / buffer.length) * 2.5;
  let x = 0;

  for (let i = 0; i < buffer.length; i++) {
    let barHeight = (buffer[i] + 140) * 2;
    if (barHeight < 0) barHeight = 0;

    const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, "#00f2fe");
    gradient.addColorStop(1, "#ff007f");

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
    x += barWidth;
  }
}

canvas.width = canvas.parentElement.clientWidth;
window.addEventListener("resize", () => {
  canvas.width = canvas.parentElement.clientWidth;
});
drawVisualizer();

function getDuration() {
  return Number(document.getElementById("duration").value);
}

// Aplica efecte globale
function applyEffects(sourceNode) {
  const volDb = parseFloat(document.getElementById("volume").value);
  const pitchSemi = parseInt(document.getElementById("pitch").value);
  const reverbWet = parseFloat(document.getElementById("reverb").value);

  const volumeNode = new Tone.Volume(volDb).toDestination();
  const reverbNode = new Tone.Reverb(reverbWet * 4 + 0.1).connect(volumeNode);
  reverbNode.wet.value = reverbWet;

  let finalNode = reverbNode;

  if (pitchSemi !== 0 && sourceNode.frequency && typeof sourceNode.triggerAttack === "function") {
    sourceNode.detune.value = pitchSemi * 100;
  } else if (pitchSemi !== 0) {
    const pitchNode = new Tone.PitchShift(pitchSemi).connect(reverbNode);
    finalNode = pitchNode;
  }

  sourceNode.connect(finalNode);
}

// --- PAD-URI (GENERATOARE DE SUNET) ---

async function playRain() {
  await Tone.start();
  if (activeRain) { activeRain.stop(); activeRain = null; return; }
  
  const dur = getDuration();
  const filter = new Tone.Filter(1500, "bandpass");
  const noise = new Tone.Noise("pink").connect(filter);
  applyEffects(filter);
  
  const lfo = new Tone.LFO(0.2, 1000, 2200).connect(filter.frequency).start();

  noise.start();
  noise.stop(`+${dur}`);
  activeRain = noise;
  setTimeout(() => { activeRain = null; lfo.dispose(); filter.dispose(); }, dur * 1000 + 500);
  return noise;
}

async function playWind() {
  await Tone.start();
  if (activeWind) { activeWind.stop(); activeWind = null; return; }
  
  const dur = getDuration();
  const noise = new Tone.Noise("brown");
  const filter = new Tone.Filter({ type: "lowpass", frequency: 250, Q: 3 });
  noise.connect(filter);
  applyEffects(filter);
  
  const lfo = new Tone.LFO(0.15, 150, 600).connect(filter.frequency).start();
  
  noise.start();
  noise.stop(`+${dur}`);
  activeWind = noise;
  setTimeout(() => { activeWind = null; lfo.dispose(); filter.dispose(); }, dur * 1000 + 500);
  return noise;
}

// REPROIECTAT: Tunet cinematic profund cu ecou în cascadă
async function playThunder() {
  await Tone.start();
  const dur = getDuration();

  const noise = new Tone.Noise("brown");
  const filter = new Tone.Filter({ type: "lowpass", frequency: 300, Q: 4 });
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.001,
    decay: Math.max(dur * 0.7, 0.3),
    sustain: 0,
    release: Math.max(dur * 0.3, 0.2),
  });

  noise.connect(env);
  env.connect(filter);
  applyEffects(filter);

  noise.start();
  env.triggerAttackRelease(dur);
  noise.stop(`+${dur + 1}`);
  activeThunder = noise;

  setTimeout(() => {
    activeThunder = null;
    try { noise.dispose(); filter.dispose(); env.dispose(); } catch(e) {}
  }, dur * 1000 + 1500);

  return noise;
}

// REPROIECTAT: Viscol tăios de munte care șuieră asimetric
async function playSnow() {
  await Tone.start();
  if (activeSnow) { activeSnow.stop(); activeSnow = null; return; }
  
  const dur = getDuration();
  const noise = new Tone.Noise("white");
  
  const windFilter = new Tone.Filter({
    type: "bandpass",
    frequency: 2800,
    Q: 4
  });
  
  noise.connect(windFilter);
  applyEffects(windFilter);
  
  const lfo = new Tone.LFO(0.1, 1800, 3800).connect(windFilter.frequency).start();
  
  noise.start();
  noise.stop(`+${dur}`);
  activeSnow = noise;
  
  setTimeout(() => { 
    activeSnow = null; 
    lfo.dispose(); 
    windFilter.dispose(); 
  }, dur * 1000 + 500);
  
  return noise;
}

async function playSword() {
  await Tone.start();
  const dur = getDuration();

  const swingLen = 0.4;
  const numSwings = Math.max(1, Math.floor(dur / swingLen));

  for (let i = 0; i < numSwings; i++) {
    const time = Tone.now() + i * swingLen;

    // Sunet metalic: noise scurt + ton care scade rapid
    const noise = new Tone.Noise("white");
    const filter = new Tone.Filter({ type: "highpass", frequency: 2000 });
    const env = new Tone.AmplitudeEnvelope({
      attack: 0.001, decay: 0.08, sustain: 0, release: 0.02
    });
    noise.connect(filter);
    filter.connect(env);
    applyEffects(env);
    noise.start(time);
    env.triggerAttack(time);
    env.triggerRelease(time + 0.08);
    noise.stop(time + 0.15);

    const metalSynth = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    });
    applyEffects(metalSynth);
    metalSynth.triggerAttackRelease("0.08", time);
  }
}

async function playExplosion() {
  await Tone.start();
  const dur = getDuration();
  
  const noise = new Tone.Noise("brown");
  const distortion = new Tone.Distortion(0.4);
  const filter = new Tone.Filter(180, "lowpass").connect(distortion);
  
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.001,
    decay: dur * 0.8,
    sustain: 0,
    release: 0.4,
  }).connect(filter);
  
  noise.connect(env);
  applyEffects(distortion);
  
  noise.start();
  env.triggerAttackRelease(dur);
  noise.stop(`+${dur + 1}`);
  return noise;
}

async function playMagic() {
  await Tone.start();
  const dur = getDuration();
  
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    modulationIndex: 12,
    resonance: 2,
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.4 }
  });
  applyEffects(synth);

  const notes = ["E5", "A5", "B5", "E6"];
  const seqLen = 0.5;
  const totalSeqs = Math.max(1, Math.floor(dur / seqLen));

  for (let s = 0; s < totalSeqs; s++) {
    notes.forEach((note, i) => {
      synth.triggerAttackRelease(note, "0.15", Tone.now() + s * seqLen + i * 0.1);
    });
  }
  return synth;
}

// REPROIECTAT: Strat de căldură + pocnituri haotice generate prin algoritm imprevizibil
let crackleIntervalRef = null; // Referință internă pentru a putea curăța intervalul la stopAll()
async function playFire() {
  await Tone.start();
  if (activeFire) { 
    if(crackleIntervalRef) clearInterval(crackleIntervalRef);
    activeFire.stop(); 
    activeFire = null; 
    return; 
  }
  
  const dur = getDuration();
  
  const flameNoise = new Tone.Noise("pink");
  const flameFilter = new Tone.Filter(400, "lowpass");
  flameNoise.connect(flameFilter);
  applyEffects(flameFilter);
  
  const crackleSynth = new Tone.MembraneSynth({
    pitchDecay: 0.001,
    octaves: 2,
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.01 }
  });
  
  const crackleFilter = new Tone.Filter(2500, "highpass");
  crackleSynth.connect(crackleFilter);
  applyEffects(crackleFilter);

  flameNoise.start();
  flameNoise.stop(`+${dur}`);
  
  crackleIntervalRef = setInterval(() => {
    if (Math.random() > 0.4) {
      try { crackleSynth.triggerAttackRelease(Math.random() * 200 + 100, "0.005"); } catch(e){}
    }
  }, 120);

  activeFire = flameNoise;
  
  setTimeout(() => { 
    activeFire = null; 
    if(crackleIntervalRef) clearInterval(crackleIntervalRef);
    flameFilter.dispose();
    crackleSynth.dispose();
    crackleFilter.dispose();
  }, dur * 1000 + 500);
  
  return flameNoise;
}

async function playForest() {
  await Tone.start();
  if (activeForest) { activeForest.releaseAll(); activeForest = null; return; }
  
  const dur = getDuration();
  const delay = new Tone.FeedbackDelay("0.25", 0.4);
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.4, decay: 0.4, sustain: 0.7, release: 0.8 },
  }).connect(delay);
  
  applyEffects(delay);
  const now = Tone.now();
  
  synth.triggerAttack("F4", now);
  synth.triggerAttack("C5", now + 0.2);
  synth.triggerAttack("E5", now + 0.4);
  
  synth.triggerRelease(["F4", "C5", "E5"], now + dur);
  
  activeForest = synth;
  setTimeout(() => { activeForest = null; delay.dispose(); }, dur * 1000 + 1000);
  return synth;
}

async function playCave() {
  await Tone.start();
  if (activeCave) { activeCave.triggerRelease(); activeCave = null; return; }
  
  const dur = getDuration();
  const synth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.4, release: 1.2 },
  });
  
  const delay = new Tone.FeedbackDelay("0.5", 0.7);
  synth.connect(delay);
  applyEffects(delay);
  
  synth.triggerAttackRelease("G2", dur);
  activeCave = synth;
  setTimeout(() => { activeCave = null; }, dur * 1000 + 1500);
  return synth;
}

async function playOcean() {
  await Tone.start();
  if (activeOcean) { activeOcean.stop(); activeOcean = null; return; }
  
  const dur = getDuration();
  const noise = new Tone.Noise("pink");
  const filter = new Tone.Filter(350, "lowpass");
  noise.connect(filter);
  applyEffects(filter);
  
  const lfo = new Tone.LFO(0.08, 100, 700).connect(filter.frequency).start();
  
  noise.start();
  noise.stop(`+${dur}`);
  activeOcean = noise;
  setTimeout(() => { activeOcean = null; lfo.dispose(); filter.dispose(); }, dur * 1000 + 500);
  return noise;
}

// --- MIXER ---

async function playMix() {
  await Tone.start();
  activeMixerInstruments.forEach(item => {
    try { item.stop(); } catch(e) {}
    try { item.triggerRelease(); } catch(e) {}
  });
  activeMixerInstruments = [];

  const choices = [
    document.getElementById("mix1").value,
    document.getElementById("mix2").value,
    document.getElementById("mix3").value,
  ].filter(c => c !== "none");

  for (const choice of choices) {
    if (synthMap[choice]) {
      const inst = await synthMap[choice]();
      if (inst) activeMixerInstruments.push(inst);
    }
  }
}

async function stopAll() {
  // Oprim intervalul pentru pocniturile focului instantaneu
  if (crackleIntervalRef) {
    clearInterval(crackleIntervalRef);
    crackleIntervalRef = null;
  }

  // Opreste noise-uri traditionale
  [activeRain, activeWind, activeSnow, activeFire, activeOcean, activeThunder].forEach(node => {
    if (node) try { node.stop(); } catch(e) {}
  });
  activeRain = activeWind = activeSnow = activeFire = activeOcean = activeThunder = null;

  // Opreste synth-uri
  [activeForest, activeCave].forEach(node => {
    if (node && typeof node.releaseAll === "function") {
       try { node.releaseAll(); } catch(e){}
    } else if (node && typeof node.triggerRelease === "function") {
       try { node.triggerRelease(); } catch(e) {}
    }
  });
  activeForest = activeCave = null;

  // Opreste mixerul complet
  activeMixerInstruments.forEach(inst => {
    if (inst) {
      try { inst.stop(); } catch(e) {}
      if (typeof inst.releaseAll === "function") { try { inst.releaseAll(); } catch(e){} }
      else { try { inst.triggerRelease(); } catch(e) {} }
    }
  });
  activeMixerInstruments = [];

  // Resetare rapida a contextului audio pentru a asigura liniste deplina
  const ctx = Tone.getContext().rawContext;
  await ctx.suspend();
  await ctx.resume();
}

// --- SEQUENCER ---

// --- SEQUENCER ---

let isRecording = false;
let sequenceClips = [];
let mediaRecorder = null;
let recordedChunks = [];

async function startRecording() {
    await Tone.start();
    if (isRecording) return;

    recordedChunks = [];

    // Folosim Web Audio API nativ in loc de Tone.Recorder
    const dest = Tone.getContext().rawContext.createMediaStreamDestination();
    Tone.getDestination().connect(dest);

    mediaRecorder = new MediaRecorder(dest.stream);
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.start();
    isRecording = true;
    document.querySelector(".seq-timeline").classList.add("recording-active");
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        recordedChunks = [];

        const clipIndex = sequenceClips.length + 1;
        sequenceClips.push({ name: `Sunet ${clipIndex}`, blob });
        updateTimeline();
    };

    mediaRecorder.stop();
    isRecording = false;
    document.querySelector(".seq-timeline").classList.remove("recording-active");
}

function updateTimeline() {
    const timeline = document.getElementById("seqTimeline");

    if (sequenceClips.length === 0) {
        timeline.innerHTML = '<p class="seq-empty">Niciun sunet inregistrat inca. Apasa "Incepe Inregistrarea" si apoi un sunet.</p>';
        return;
    }

    timeline.innerHTML = sequenceClips.map((clip, i) => `
        <div class="seq-chip">
             ${clip.name}
            <button onclick="removeClip(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.8rem;">✕</button>
        </div>
    `).join('');
}

function removeClip(index) {
    sequenceClips.splice(index, 1);
    sequenceClips.forEach((clip, i) => { clip.name = `Sunet ${i + 1}`; });
    updateTimeline();
}

async function playSequence() {
    if (sequenceClips.length === 0) return;

    for (const clip of sequenceClips) {
        const url = URL.createObjectURL(clip.blob);
        const audio = new Audio(url);
        await new Promise(resolve => {
            audio.onended = resolve;
            audio.play();
        });
        URL.revokeObjectURL(url);
    }
}

function exportSequence() {
    if (sequenceClips.length === 0) return;

    const combined = new Blob(sequenceClips.map(c => c.blob), { type: "audio/webm" });
    const url = URL.createObjectURL(combined);
    const fileName = document.getElementById("seqFileName").value.trim() || "secventa";

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.webm`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearSequence() {
    sequenceClips = [];
    updateTimeline();
}