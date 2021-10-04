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

async function startStream() {
    saveWrap.classList.add('hidden');
    try {
        screen = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        audio = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
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
}

function mergeAndRecordStream() {
    if (screen && audio) {
        stream = new MediaStream([...screen.getTracks(), ...audio.getTracks()])
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
            audio.getTracks().forEach((track) => track.stop());
        };
        recorder.start(1000);
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        console.log('No stream available.');
    }
}

window.addEventListener('load', () => {
    video = document.querySelector('.feedback');
    startBtn = document.querySelector('.start-recording');
    stopBtn = document.querySelector('.stop-recording');
    saveBtn = document.querySelector('.save-recording');
    saveWrap = document.querySelector('.save-wrap');

    startBtn.addEventListener('click', startStream);
    stopBtn.addEventListener('click', stopStream);
});