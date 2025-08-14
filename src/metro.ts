import Drome from "@/drome/drome-2";

let drome = new Drome();

// drome.onBeat = (n: number) => console.log("Beat:", n);
// drome.onBar = (n: number) => console.log("Bar:", n);

const startBtn = document.createElement("button");
startBtn.innerHTML = "Start";
document.body.appendChild(startBtn);

const pauseBtn = document.createElement("button");
pauseBtn.innerHTML = "Pause";
document.body.appendChild(pauseBtn);

const stopBtn = document.createElement("button");
stopBtn.innerHTML = "Stop";
document.body.appendChild(stopBtn);

startBtn.addEventListener("click", () => {
  drome.start();
});

stopBtn.addEventListener("click", () => {
  drome.stop();
});

pauseBtn.addEventListener("click", () => {
  drome.pause();
});
