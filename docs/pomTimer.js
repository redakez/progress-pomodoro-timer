import { StateEnum, getTimeFormatted_Ms_M, LoggingEvents } from "./utils.js";
import { Timer } from "./timer.js";
import { Manager } from "./manager.js";
import { Settings } from "./settings.js";
import { Logs } from "./logs.js";

export class PomodoroTimer {

   constructor(mainDivEl) {
      this._mainDivEl = mainDivEl;
      this._mainDivEl.innerHTML = "";

      //Local storage first init
      if (localStorage.curProgress == null || localStorage.pomodoroCount == null
         || localStorage.pomodoroLen == null || localStorage.lastProgressUpdate == null) {
         localStorage.curProgress = 0;
         localStorage.pomodoroCount = 8;
         localStorage.pomodoroLen = 30 * 1000 * 60; //30 minutes
         localStorage.lastProgressUpdate = Date.now();
      }

      //Removing old progress if a certain amount of time passed
      if (Date.now() - localStorage.lastProgressUpdate > 1000 * 60 * 60 * 8) { //8 hours
         localStorage.lastProgressUpdate = Date.now();
         localStorage.curProgress = 0;
      }

      //Init sub-classes
      this._state = StateEnum.OFF;
      this._Timer = new Timer(this);
      this._Manager = new Manager(this);
      this._Settings = new Settings(this);
      this._Logs = new Logs(this);

      //Init local interface
      this.initPomoroProgressInterface();
      this.initTabsInterface();

      // Compute additional parameters
      let tmpProgress = localStorage.curProgress;
      localStorage.curProgress = 0;
      this.addProgressTime(tmpProgress);
      let maxVal = localStorage.pomodoroLen * localStorage.pomodoroCount;
      this._lastPomodoro = localStorage.curProgress > (maxVal - localStorage.pomodoroLen);

      //Initialize rest of the UI
      this._Timer.initInterface(this._tabDivs[0]);
      this._Manager.initInterface(this._tabDivs[1]);
      this._Settings.initInterface(this._tabDivs[2]);
      this._Logs.initInterface(this._tabDivs[3]);
      this.fullInterfaceUpdate();

      //Enable notifications
      if (("Notification" in window) && Notification.permission == "default") {
         Notification.requestPermission();
      }

      //Offline stuff
      if (navigator.onLine) {
         console.log("Online")
      } else {
         console.log("Offline")
      }

      //Finish
      this.logEvent(LoggingEvents.AppLoad);
      //this.createDummyEvents();
   }

   //Interface initialization

   initPomoroProgressInterface() {
      //Pomodor count and progress label
      this._pomodoroLabel = document.createElement("label");
      this._pomodoroLabel.classList.add("text-center");
      this._mainDivEl.appendChild(this._pomodoroLabel);

      //Extra time label
      this._extraTimeLabelEl = document.createElement("label");
      this._extraTimeLabelEl.classList.add("text-center");
      this._mainDivEl.appendChild(this._extraTimeLabelEl);

      //Daily goal progress bar (div + progress)
      let pomodoroProgressDiv = document.createElement("div");
      pomodoroProgressDiv.classList.add("prog-cent-div");
      this._pomodoroMeterEl = document.createElement("meter");
      this._pomodoroMeterEl.value = 0;
      this._pomodoroMeterEl.classList.add("mid");
      pomodoroProgressDiv.appendChild(this._pomodoroMeterEl);
      this._mainDivEl.appendChild(pomodoroProgressDiv);
   }

   initTabsInterface() {
      let tabNavDiv = document.createElement("div");
      tabNavDiv.id = "tabs-nav-div";
      tabNavDiv.innerHTML = "";
      let tabNames = ["Timer", "Manager", "Settings", "Logs"];
      let radios = [];

      //Creating the radio input
      for (const sub of tabNames) {
         let radio = document.createElement("input");
         radios.push(radio);
         radio.type = "radio";
         radio.name = "tab-radio";
         radio.id = "radio-" + sub;
         if (sub == "Timer") {
            radio.checked = "checked";
         }
         this._mainDivEl.appendChild(radio);
      }

      //History API
      history.replaceState({ tab: "Timer" }, null, "#Timer");
      window.addEventListener('popstate', function (e) {
         switch (e.state.tab) {
            case "Timer": radios[0].checked = "checked"; break;
            case "Manager": radios[1].checked = "checked"; break;
            case "Settings": radios[2].checked = "checked"; break;
            case "Logs": radios[3].checked = "checked"; break;
         }
      });

      //Creating the tab labels
      for (const sub of tabNames) {
         let label = document.createElement("label");
         label.classList.add("tab-label");
         label.setAttribute("for", "radio-" + sub);
         label.for = "radio-" + sub;
         label.innerHTML = sub;
         label.addEventListener("click", () => {
            history.pushState({ tab: sub }, null, "#" + sub);
         });
         tabNavDiv.appendChild(label);
      }

      //Creating the tab divs
      this._mainDivEl.appendChild(tabNavDiv);
      this._tabDivs = [];
      for (const sub of tabNames) {
         let tabDiv = document.createElement("div");
         tabDiv.id = "tab-div-" + sub;
         this._mainDivEl.appendChild(tabDiv);
         tabDiv.classList.add("tabbed-div");
         this._tabDivs.push(tabDiv);
      }
   }

   //Interface update functions

   fullInterfaceUpdate() {
      this.updatePomodoroProgress();
      this._Timer.updateTimerAction();
      this._Timer.updateButtonsVisibility();
   }

   updatePomodoroProgress() {
      let curPomodoro = Math.floor(localStorage.curProgress / localStorage.pomodoroLen);
      let extraTime = localStorage.curProgress % localStorage.pomodoroLen;
      this._pomodoroLabel.innerText = "Pomodoro: " + curPomodoro + " / " + localStorage.pomodoroCount;
      this._extraTimeLabelEl.innerText = "Extra time: " + getTimeFormatted_Ms_M(extraTime);
      this._pomodoroMeterEl.value = localStorage.curProgress;
      this._pomodoroMeterEl.max = localStorage.pomodoroCount * localStorage.pomodoroLen;
   }

   //Progress arithmetic

   addProgressTime(amount) {
      if (amount == 0) return;
      localStorage.curProgress = Number(localStorage.curProgress) + Number(amount);
      let maxVal = localStorage.pomodoroCount * localStorage.pomodoroLen;
      if (localStorage.curProgress >= maxVal) {
         this._state = StateEnum.DONE;
         localStorage.curProgress = maxVal;
         this._pomodoroMeterEl.classList.add("gold");
         this._Timer.stopTimer();
      }
      if (localStorage.curProgress >= maxVal - localStorage.pomodoroLen) {
         this._lastPomodoro = true;
      }
   }

   removeProgressTime(amount) {
      if (amount == 0) return;
      localStorage.curProgress = Number(localStorage.curProgress) - Number(amount);
      this._pomodoroMeterEl.classList.remove("gold");
      if (localStorage.curProgress < 0) {
         localStorage.curProgress = 0;
      }
      if (this._state == StateEnum.DONE) {
         this._state = StateEnum.OFF;
      }
      let maxVal = localStorage.pomodoroCount * localStorage.pomodoroLen;
      if (localStorage.curProgress < maxVal - localStorage.pomodoroLen) {
         this._lastPomodoro = false;
      }
   }

   //Logging

   logEvent(event) {
      this._Logs.addRecord(Date.now(), event, Number(localStorage.curProgress) + Number(this._Timer.getCurTimerTime()));
   }

   createDummyEvents() { //For debugging
      this._Logs.addRecord(Date.now(), LoggingEvents.AppLoad, 0);
      this._Logs.addRecord(Date.now() + 30 * 1000, LoggingEvents.AddTime, 20000);
      this._Logs.addRecord(Date.now() + 40 * 1000, LoggingEvents.TimerStart, 20000);
      this._Logs.addRecord(Date.now() + 131 * 1000, LoggingEvents.TimerPause, 201211);
      this._Logs.addRecord(Date.now() + 162 * 1000, LoggingEvents.TimerResume, 201211);
      this._Logs.addRecord(Date.now() + 284 * 1000, LoggingEvents.TimerFinish, 681281);
   }

}
