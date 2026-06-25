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

// Referinte pentru sunetele ambientale pornite din PAD-uri
let activeRain = null;
let activeWind = null;
let activeThunder = null;
let activeSnow = null;
let activeFire = null;
let activeForest = null;
let activeCave = null;
let activeOcean = null;

// REPARATIE: Lista globala pentru a tine evidenta sunetelor pornite din MIXER
let activeMixerInstruments = [];

// Setup Visualizer (Canvas)
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
  let barHeight;
  let x = 0;

  for (let i = 0; i < buffer.length; i++) {
    // Convertim valorile FFT in inaltime pentru bare
    barHeight = (buffer[i] + 140) * 2;
    if (barHeight < 0) barHeight = 0;

    // Gradient modern Cyan -> Roz in functie de frecventa
    const gradient = canvasCtx.createLinearGradient(
      0,
      height,
      0,
      height - barHeight,
    );
    gradient.addColorStop(0, "#00f2fe");
    gradient.addColorStop(1, "#ff007f");

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
    x += barWidth;
  }
}
// Redimensionare canvas si pornire animatie
canvas.width = canvas.parentElement.clientWidth;
window.addEventListener("resize", () => {
  canvas.width = canvas.parentElement.clientWidth;
});
drawVisualizer();

// Functie ajutatoare pentru aplicarea efectelor globale (Volume, Pitch, Reverb)
function applyEffects(sourceNode) {
  const volDb = parseFloat(document.getElementById("volume").value);
  const pitchSemi = parseInt(document.getElementById("pitch").value);
  const reverbRoom = parseFloat(document.getElementById("reverb").value);

  const volumeNode = new Tone.Volume(volDb).toDestination();
  const reverbNode = new Tone.Reverb({
    roomSize: reverbRoom,
    wet: 0.5,
  }).connect(volumeNode);
  let lastNode = reverbNode;

  if (pitchSemi !== 0) {
    const pitchNode = new Tone.PitchShift(pitchSemi).connect(reverbNode);
    lastNode = pitchNode;
  }

  sourceNode.connect(lastNode);
}

// --- GENERATOARE DE SUNET (PAD-URI) ---

function playRain() {
  Tone.start();
  if (activeRain) {
    activeRain.stop();
    activeRain = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const rainNoise = new Tone.Noise("pink");
  applyEffects(rainNoise);

  rainNoise.start();
  rainNoise.stop("+" + duration);
  activeRain = rainNoise;
  return rainNoise;
}

function playWind() {
  Tone.start();
  if (activeWind) {
    activeWind.stop();
    activeWind = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const windNoise = new Tone.Noise("brown");

  const filter = new Tone.Filter({ type: "lowpass", frequency: 400, Q: 2 });
  windNoise.connect(filter);
  applyEffects(filter);

  // Auto-pan / miscare stanga-dreapta pentru vant
  const lfo = new Tone.LFO(0.5, 200, 800).connect(filter.frequency).start();

  windNoise.start();
  windNoise.stop("+" + duration);
  activeWind = windNoise;
  return windNoise;
}

function playThunder() {
  Tone.start();
  const duration = parseFloat(document.getElementById("duration").value);

  const noise = new Tone.Noise("brown");
  const filter = new Tone.Filter(200, "lowpass");
  noise.connect(filter);
  applyEffects(filter);

  // Invelis de volum descrescator pentru tunet
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.05,
    decay: duration - 0.1,
    sustain: 0,
    release: 0.1,
  }).connect(filter);

  noise.connect(env);
  noise.start();
  env.triggerAttackRelease(duration);
  return noise;
}

function playSnow() {
  Tone.start();
  if (activeSnow) {
    activeSnow.stop();
    activeSnow = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const snowNoise = new Tone.Noise("white");
  const filter = new Tone.Filter(3000, "highpass");

  snowNoise.connect(filter);
  applyEffects(filter);

  snowNoise.start();
  snowNoise.stop("+" + duration);
  activeSnow = snowNoise;
  return snowNoise;
}

function playSword() {
  Tone.start();
  const synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
  });
  applyEffects(synth);

  // Glissando rapid de frecventa pentru simularea taisului
  synth.triggerAttackRelease("C6", "0.05");
  synth.frequency.rampTo("C4", 0.15);
  return synth;
}

function playExplosion() {
  Tone.start();
  const duration = parseFloat(document.getElementById("duration").value);

  const noise = new Tone.Noise("brown");
  const filter = new Tone.Filter(150, "lowpass");
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.01,
    decay: duration,
    sustain: 0,
    release: 0.2,
  }).connect(filter);

  noise.connect(env);
  applyEffects(filter);

  noise.start();
  env.triggerAttackRelease(duration);
  return noise;
}

function playMagic() {
  Tone.start();
  const duration = parseFloat(document.getElementById("duration").value);

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.3, release: 0.5 },
  });
  applyEffects(synth);

  const acum = Tone.now();
  // Arpegiu magic pe un acord major
  synth.triggerAttackRelease("C5", "0.2", acum);
  synth.triggerAttackRelease("E5", "0.2", acum + 0.1);
  synth.triggerAttackRelease("G5", "0.2", acum + 0.2);
  synth.triggerAttackRelease("C6", "0.4", acum + 0.3);
  return synth;
}

function playFire() {
  Tone.start();
  if (activeFire) {
    activeFire.stop();
    activeFire = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const fireNoise = new Tone.Noise("pink");
  const filter = new Tone.Filter(800, "bandpass");

  fireNoise.connect(filter);
  applyEffects(filter);

  fireNoise.start();
  fireNoise.stop("+" + duration);
  activeFire = fireNoise;
  return fireNoise;
}

function playForest() {
  Tone.start();
  if (activeForest) {
    activeForest.stop();
    activeForest = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 1 },
  });
  applyEffects(synth);

  const now = Tone.now();
  // Sunete aerisite (pasari/ecou) distantate in timp
  synth.triggerAttackRelease("E4", duration / 3, now);
  synth.triggerAttackRelease("A4", duration / 3, now + duration / 4);

  activeForest = synth;
  return synth;
}

function playCave() {
  Tone.start();
  if (activeCave) {
    activeCave.stop();
    activeCave = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const synth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.2, decay: 0.8, sustain: 0.1, release: 1 },
  });

  // Adaugam un delay masiv specific unei pesteri deep
  const delay = new Tone.FeedbackDelay("0.4", 0.6);
  synth.connect(delay);
  applyEffects(delay);

  synth.triggerAttackRelease("A2", duration);
  activeCave = synth;
  return synth;
}

function playOcean() {
  Tone.start();
  if (activeOcean) {
    activeOcean.stop();
    activeOcean = null;
    return;
  }

  const duration = parseFloat(document.getElementById("duration").value);
  const noise = new Tone.Noise("pink");
  const filter = new Tone.Filter(300, "lowpass").toDestination();

  noise.connect(filter);
  applyEffects(filter);

  // LFO lent pentru a simula miscarea valurilor (flux/reflux)
  const lfo = new Tone.LFO(0.1, 150, 600).connect(filter.frequency).start();

  noise.start();
  noise.stop("+" + duration);
  activeOcean = noise;
  return noise;
}

// --- LOGICA MIXER & REPARATIE OPRIRE ---

function playMix() {
  Tone.start();

  const choice1 = document.getElementById("mix1").value;
  const choice2 = document.getElementById("mix2").value;
  const choice3 = document.getElementById("mix3").value;

  const choices = [choice1, choice2, choice3];

  // Inainte de a porni un mix nou, le oprim pe cele vechi din mixer
  activeMixerInstruments.forEach((item) => {
    try {
      item.triggerRelease();
    } catch (e) {}
    try {
      item.stop();
    } catch (e) {}
  });
  activeMixerInstruments = [];

  choices.forEach((choice) => {
    if (choice !== "none" && synthMap[choice]) {
      // Executam functia de sunet aferenta din mapare
      const inst = synthMap[choice]();

      // Daca functia a returnat un obiect valid, il salvam in lista
      if (inst) {
        activeMixerInstruments.push(inst);
      }
    }
  });
}

function stopAll() {
  console.log("Oprim absolut toate sunetele din studio...");

  // 1. Oprim pad-urile individuale active
  if (activeRain) {
    activeRain.stop();
    activeRain = null;
  }
  if (activeWind) {
    activeWind.stop();
    activeWind = null;
  }
  if (activeThunder) {
    activeThunder.stop();
    activeThunder = null;
  }
  if (activeSnow) {
    activeSnow.stop();
    activeSnow = null;
  }
  if (activeFire) {
    activeFire.stop();
    activeFire = null;
  }
  if (activeForest) {
    activeForest.stop();
    activeForest = null;
  }
  if (activeCave) {
    activeCave.stop();
    activeCave = null;
  }
  if (activeOcean) {
    activeOcean.stop();
    activeOcean = null;
  }

  // 2. REPARATIA EFECTIVA: Trecem prin toate elementele pornite de Mixer si le inchidem safe
  activeMixerInstruments.forEach((instrument) => {
    if (instrument) {
      try {
        if (typeof instrument.triggerRelease === "function") {
          instrument.triggerRelease();
        }
        if (typeof instrument.stop === "function") {
          instrument.stop();
        }
      } catch (error) {
        console.warn(
          "Nu s-a putut opri un nod audio (era deja inchis):",
          error,
        );
      }
    }
  });

  // Resetam complet lista mixerului golind memoria
  activeMixerInstruments = [];
}
