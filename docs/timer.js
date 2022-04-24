import { StateEnum, getTimeFormatted_adaptive, LoggingEvents, iconBase64 } from "./utils.js";

export class Timer {

   constructor(pomTimer) {
      this.PT = pomTimer;

      this._TIMER_UPDATE_INTERVAL = 1000;

      this._startTime = Date.now();
      this._pauseTime = 0;
      this._timer = null;
      this._alarm = new Audio("alarm.mp3");
      this._alarm.loop = true;
   }

   //Interface initialization

   initInterface(timerDivEl) {
      //Timer label
      this._timeLabelEl = document.createElement("label");
      this._timeLabelEl.classList.add("text-center");
      timerDivEl.appendChild(this._timeLabelEl);

      //Timer progress bar
      let progressDiv = document.createElement("div");
      progressDiv.classList.add("cent-div");
      this._timerMeterEl = document.createElement("meter");
      this._timerMeterEl.value = 0;
      progressDiv.appendChild(this._timerMeterEl);
      timerDivEl.appendChild(progressDiv);

      //Buttons
      let buttonDiv = document.createElement("div");
      buttonDiv.classList.add("cent-div");

      this._startButtonEl = this.getButton("Start", false, (e) => this.startButtonAction());
      buttonDiv.appendChild(this._startButtonEl);
      this._pauseButtonEl = this.getButton("Pause", true, (e) => this.pauseButtonAction());
      buttonDiv.appendChild(this._pauseButtonEl);
      this._resumeButtonEl = this.getButton("Resume", true, (e) => this.resumeButtonAction());
      buttonDiv.appendChild(this._resumeButtonEl);
      this._finishButtonEl = this.getButton("Finish", true, (e) => this.finishButtonAction());
      buttonDiv.appendChild(this._finishButtonEl);

      timerDivEl.appendChild(buttonDiv);
   }

   getButton(name, hidden, action) {
      let ret = document.createElement("button");
      ret.textContent = name;
      ret.addEventListener("click", action);
      if (hidden) {
         ret.style.display = "none";
      }
      return ret;
   }

   //Timer basics

   startTimer() {
      this._timer = setInterval(() => this.updateTimerAction(), this._TIMER_UPDATE_INTERVAL);
   }

   stopTimer() {
      clearInterval(this._timer);
   }

   getCurTimerTime() {
      switch (this.PT._state) {
         case StateEnum.FINISHED:
            return localStorage.pomodoroLen;
         case StateEnum.RUNNING:
            return Date.now() - this._startTime;
         case StateEnum.PAUSED:
            return this._pauseTime - this._startTime;
         default:
            return 0;
      }
   }

   //UI update functions + timer tick function

   updateTimerToTime(timeMs) {
      let timeMax;
      if (this.PT._lastPomodoro) {
         timeMax = (localStorage.pomodoroLen * localStorage.pomodoroCount) - localStorage.curProgress;
      } else {
         timeMax = localStorage.pomodoroLen;
      }
      this._timeLabelEl.innerText = getTimeFormatted_adaptive(Math.min(timeMs, timeMax)) + " / " + getTimeFormatted_adaptive(timeMax);
      this._timerMeterEl.value = timeMs;
      if (this.PT._state == StateEnum.DONE) {
         this._timerMeterEl.max = 1;
      } else {
         this._timerMeterEl.max = timeMax;
      }
   }

   updateTimerAction() {
      switch (this.PT._state) {
         case StateEnum.OFF:
         case StateEnum.DONE:
            this.updateTimerToTime(0);
            break;
         case StateEnum.RUNNING:
            let curTimeMs = Date.now() - this._startTime;
            if ((!this.PT._lastPomodoro && curTimeMs > localStorage.pomodoroLen)
               ||
               (this.PT._lastPomodoro && curTimeMs + Number(localStorage.curProgress) > localStorage.pomodoroCount * localStorage.pomodoroLen)) {
               this.PT._state = StateEnum.FINISHED;
               this.updateTimerToTime(localStorage.pomodoroLen);
               this.stopTimer();
               this.updateButtonsVisibility();
               this.timerFinishedNotification();
               this._alarm.play();
            } else {
               this.updateTimerToTime(curTimeMs);
            }
            break;
         case StateEnum.PAUSED:
            this.updateTimerToTime(this._pauseTime - this._startTime);
            break;
         case StateEnum.FINISHED:
            this.updateTimerToTime(localStorage.pomodoroLen);
            break;
      }
   }

   updateButtonsVisibility() {
      switch (this.PT._state) {
         case StateEnum.OFF: this.updateButtonsVisibilityTo(true, false, false, false); break;
         case StateEnum.RUNNING: this.updateButtonsVisibilityTo(false, true, false, false); break;
         case StateEnum.PAUSED: this.updateButtonsVisibilityTo(false, false, true, true); break;
         case StateEnum.FINISHED: this.updateButtonsVisibilityTo(false, false, false, true); break;
         case StateEnum.DONE: this.updateButtonsVisibilityTo(false, false, false, false); break;
      }
   }

   updateButtonsVisibilityTo(startVal, pauseVal, resumeVal, finishVal) {
      let displVal = "inline-block";
      this._startButtonEl.style.display = startVal ? displVal : "none";
      this._pauseButtonEl.style.display = pauseVal ? displVal : "none";
      this._resumeButtonEl.style.display = resumeVal ? displVal : "none";
      this._finishButtonEl.style.display = finishVal ? displVal : "none";
   }

   localUiUpdate() {
      this.updateTimerAction();
      this.updateButtonsVisibility();
   }

   //Notifications

   timerFinishedNotification() {
      if (!("Notification" in window)) {
         return;
      } else if (Notification.permission == "granted" && localStorage.notifOn == 1) {
         let notif = new Notification("Pomodoro finished! Click here to confirm pomodoro end", { icon: iconBase64 });
         notif.onclick = () => this.finishButtonAction();
      }
   }

   //Button actions

   startButtonAction() {
      this._startTime = Date.now();
      this.PT._state = StateEnum.RUNNING;
      this.startTimer();
      this.localUiUpdate();
      this.PT.logEvent(LoggingEvents.TimerStart);
   }

   pauseButtonAction() {
      this._pauseTime = Date.now();
      this.PT._state = StateEnum.PAUSED;
      this.stopTimer();
      this.localUiUpdate();
      this.PT.logEvent(LoggingEvents.TimerPause);
   }

   resumeButtonAction() {
      this.PT._state = StateEnum.RUNNING;
      this._startTime = Date.now() - (this._pauseTime - this._startTime);
      this.startTimer();
      this.localUiUpdate();
      this.PT.logEvent(LoggingEvents.TimerResume);
   }

   finishButtonAction() {
      let curState = this.PT._state;
      this.PT._state = StateEnum.OFF;
      if (curState == StateEnum.FINISHED) {
         this.PT.addProgressTime(localStorage.pomodoroLen);
         this._alarm.pause();
         this._alarm.currentTime = 0;
      } else {
         this.PT.addProgressTime(this._pauseTime - this._startTime);
      }
      this.PT.fullInterfaceUpdate();
      this.PT.logEvent(LoggingEvents.TimerFinish);
   }

}