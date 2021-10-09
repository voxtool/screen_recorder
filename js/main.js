let screen
let audio
let stream
let chunks = [];
let recorder
let startBtn
let stopBtn
let saveBtn
let video
let saveWrap
let micBtn
let systemBtn
let micIndicator
let systemIndicator


async function startStream() {
    saveWrap.classList.add('hidden');
    try {
        screen = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: systemBtn?.checked
        });
        if (micBtn.checked) {
            audio = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });
        }
        mergeAndRecordStream();
        startPlayback();
    } catch (error) {
        console.log(error);
    }
}

function startPlayback() {
    if (stream) {
        video.srcObject = stream;
        video.controls = false;
        video.muted = true;
        video.play();
    } else {
        console.warn('No stream available.');
    }
}

async function stopStream() {
    recorder.stop()
    startBtn.disabled = false;
    stopBtn.disabled = true;
    micBtn.disabled = false;
    systemBtn.disabled = false;
}

function mergeAndRecordStream() {
    if (screen) {
        if (audio) {
            stream = new MediaStream([...screen.getVideoTracks(), ...mergeAudioStreams(screen, audio)]);
            //stream = new MediaStream([...screen.getTracks(), ...audio.getTracks()]);
        } else {
            stream = new MediaStream([...screen.getTracks()]);
        }
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = (e) => {
            const blob = new Blob(chunks, { 'type': 'video/mp4' });
            chunks = [];
            const file = URL.createObjectURL(blob);
            saveBtn.href = file;
            saveBtn.download = `${Date.now().toString()}.mp4`;
            video.srcObject = null;
            video.src = file;
            video.controls = true;
            video.muted = false;
            video.load();
            video.onloadeddata = () => {
                video.play();
            }
            saveWrap.classList.remove('hidden');
            saveWrap.scrollIntoView({ behavior: "smooth", block: "start" });
            screen.getTracks().forEach((track) => track.stop());
            if (audio) {
                audio.getTracks().forEach((track) => track.stop());
            }
        };
        recorder.start(1000);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        micBtn.disabled = true;
        systemBtn.disabled = true;
    } else {
        console.log('No stream available.');
    }
}

function checkedState(checkbox, element) {
    if (checkbox.checked) {
        element.innerHTML = 'On';
        element.style.color = '#3CB371';
    } else {
        element.innerHTML = 'Off';
        element.style.color = '#AE1100';
    }
}

function mergeAudioStreams(systemSound, micSound) {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    let hasSystem = false;
    let hasMic = false;
    if (systemSound && systemSound.getAudioTracks().length > 0) {
        const source1 = context.createMediaStreamSource(systemSound);
        const desktopGain = context.createGain();
        desktopGain.gain.value = 0.7;
        source1.connect(desktopGain).connect(destination);
        hasSystem = true;
    }

    if (micSound && micSound.getAudioTracks().length > 0) {
        const source2 = context.createMediaStreamSource(micSound);
        const voiceGain = context.createGain();
        voiceGain.gain.value = 0.7;
        source2.connect(voiceGain).connect(destination);
        hasMic = true;
    }
    return (hasSystem || hasMic) ? destination.stream.getAudioTracks() : [];
};

window.addEventListener('load', () => {
    video = document.querySelector('.feedback');
    startBtn = document.querySelector('.start-recording');
    stopBtn = document.querySelector('.stop-recording');
    saveBtn = document.querySelector('.save-recording');
    saveWrap = document.querySelector('.save-wrap');
    micBtn = document.querySelector('#mic');
    systemBtn = document.querySelector('#system');
    micIndicator = document.querySelector('.mic-indicator');
    systemIndicator = document.querySelector('.system-indicator');

    checkedState(micBtn, micIndicator);
    checkedState(systemBtn, systemIndicator);

    startBtn.addEventListener('click', startStream);
    stopBtn.addEventListener('click', stopStream);
    micBtn.addEventListener('change', (e) => {
        checkedState(micBtn, micIndicator);
    });
    systemBtn.addEventListener('change', (e) => {
        checkedState(systemBtn, systemIndicator);
    });
});