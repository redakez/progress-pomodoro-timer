import { getCenteredButtonArray, StateEnum, getTimeFormatted_M_H_adaptive, LoggingEvents, iconBase64 } from "./utils.js";

export class Timer {

   constructor(pomTimer) {
      this.PT = pomTimer;

      this._TIMER_UPDATE_INTERVAL = 1000;
      this._EYE_REST_INTERVAL = 1000 * 60 * 20; //20 minutes

      this._startTime = Date.now();
      this._pauseTime = 0;
      this._timer = null;
      this._eyeTimer = null;
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
      let buttons = getCenteredButtonArray(timerDivEl, ["Start", "Pause", "Resume", "Finish"]);
      this._startButtonEl = buttons[0];
      this._pauseButtonEl = buttons[1];
      this._resumeButtonEl = buttons[2];
      this._finishButtonEl = buttons[3];
      this._startButtonEl.addEventListener("click", () => this.startButtonAction());
      this._pauseButtonEl.addEventListener("click", () => this.pauseButtonAction());
      this._resumeButtonEl.addEventListener("click", () => this.resumeButtonAction());
      this._finishButtonEl.addEventListener("click", () => this.finishButtonAction());
   }

   //Timer basics

   startTimer() {
      this._timer = setInterval(() => this.updateTimerAction(), this._TIMER_UPDATE_INTERVAL);
      this._eyeTimer = setInterval(() => this.eyeRestNotification(), this._EYE_REST_INTERVAL);
   }

   stopTimer() {
      clearInterval(this._timer);
      clearInterval(this._eyeTimer);
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
      this._timeLabelEl.innerText = getTimeFormatted_M_H_adaptive(Math.min(timeMs, timeMax)) + " / " + getTimeFormatted_M_H_adaptive(timeMax);
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
            const curTimeMs = Date.now() - this._startTime;
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
      const displVal = "inline-block";
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

   eyeRestNotification() {
      if (!("Notification" in window)) {
         return;
      } else if (Notification.permission == "granted" && localStorage.eyeNotifOn == 1) {
         let notif = new Notification("Look into distance for at least 20 seconds. Also blink a few times.", { icon: iconBase64 });
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
      const savedState = this.PT._state;
      this.PT._state = StateEnum.OFF;
      if (savedState == StateEnum.FINISHED) {
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