import { StateEnum, getTimeFormatted_M_H_adaptive, LoggingEvents } from "./utils.js";
import { Timer } from "./timer.js";
import { Manager } from "./manager.js";
import { Settings } from "./settings.js";
import { Logs } from "./logs.js";

/*
The PomodoroTimer class uses 4 others classes, which are linked together with the PomodoroTimer class.
Here is a diagram:

             +-----------------------+
             |     PomodoroTimer     |
             +-----------------------+
            /     |             |     \
           /      |             |      \
          /       |             |       \
         /        |             |        \
+-------+    +---------+  +----------+    +------+
| Timer |    | Manager |  | Settings |    | Logs |
+-------+    +---------+  +----------+    +------+
All classes are instanced only once and each class is in its own file.
*/
export class PomodoroTimer {

   constructor(mainDivEl) {
      this._mainDivEl = mainDivEl;
   }

   init() {
      this._mainDivEl.innerHTML = ""; //Remove the loading label

      //Local storage first init
      if (localStorage.curProgress == null || localStorage.pomodoroCount == null
         || localStorage.pomodoroLen == null || localStorage.lastProgressUpdate == null) {
         localStorage.curProgress = 0;
         localStorage.pomodoroCount = 8;
         localStorage.pomodoroLen = 30 * 1000 * 60; //30 minutes
         localStorage.notifOn = 0;
         localStorage.notesOn = 0;
         localStorage.pausedProgress = 0;
      }

      //Removing old progress if a certain amount of time passed
      if (Date.now() - localStorage.lastProgressUpdate > 1000 * 60 * 60 * 12) { //12 hours
         localStorage.curProgress = 0;
         localStorage.pausedProgress = 0;
         localStorage.removeItem("records");
      }
      localStorage.lastProgressUpdate = Date.now();

      //Init sub-classes
      this._state = StateEnum.OFF;
      this._Timer = new Timer(this);
      this._Manager = new Manager(this);
      this._Settings = new Settings(this);
      this._Logs = new Logs(this);

      //Init local interface
      this.initPomoroProgressInterface();
      this.initTabsInterface();

      // Set the application state based on data in localStorage
      let tmpProgress = localStorage.curProgress;
      localStorage.curProgress = 0;
      this.addProgressTime(tmpProgress);
      let maxVal = localStorage.pomodoroLen * localStorage.pomodoroCount;
      this._lastPomodoro = localStorage.curProgress > (maxVal - localStorage.pomodoroLen);
      if (localStorage.pausedProgress > 0) {
         this._Timer._startTime = 0;
         this._Timer._pauseTime = Number(localStorage.pausedProgress);
         this._state = StateEnum.PAUSED;
      }
      this._Logs.loadFromLocalStorage();

      //Initialize rest of the UI
      this._Timer.initInterface(this._tabDivs[0]);
      this._Manager.initInterface(this._tabDivs[1]);
      this._Settings.initInterface(this._tabDivs[2]);
      this._Logs.initInterface(this._tabDivs[3]);
      this.fullInterfaceUpdate();

      //Offline stuff
      if (navigator.onLine) {
         console.log("Online")
      } else {
         console.log("Offline")
      }

      //Event listener for window close
      window.addEventListener("beforeunload", (e) => {
         localStorage.notes = this._notes.value;
         this._Logs.saveToLocalStorage();
         if (this._state == StateEnum.PAUSED || this._state == StateEnum.RUNNING) {
            localStorage.pausedProgress = this._Timer.getCurTimerTime();
         } else if (this._state == StateEnum.FINISHED) {
            this.addProgressTime(localStorage.pomodoroLen);
         } else {
            localStorage.pausedProgress = 0;
         }
      });

      //Log succesful load
      this.logEvent(LoggingEvents.AppLoad);
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
      pomodoroProgressDiv.classList.add("cent-div");
      this._pomodoroMeterEl = document.createElement("meter");
      pomodoroProgressDiv.appendChild(this._pomodoroMeterEl);
      this._mainDivEl.appendChild(pomodoroProgressDiv);

      //Notes (div + textarea)
      this._notesDiv = document.createElement("div");
      this._notesDiv.classList.add("cent-div");
      this._notes = document.createElement("textarea");
      this._notes.setAttribute("rows", 7);
      this._notes.setAttribute("placeholder", "Write your notes here");
      this._notes.innerHTML = localStorage.notes ?? "";
      this._notesDiv.appendChild(this._notes);
      this._mainDivEl.appendChild(this._notesDiv);


   }

   initTabsInterface() {
      let tabNavDiv = document.createElement("div");
      tabNavDiv.id = "tabs-nav-div";
      tabNavDiv.innerHTML = "";
      const tabNames = ["Timer", "Manager", "Settings", "Logs"];
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
         radios[tabNames.indexOf(e.state.tab)].checked = "checked";
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
      this.notesShowUpdate();
      this._Timer.updateTimerAction();
      this._Timer.updateButtonsVisibility();
   }

   updatePomodoroProgress() {
      const curPomodoro = Math.floor(localStorage.curProgress / localStorage.pomodoroLen);
      const extraTime = localStorage.curProgress % localStorage.pomodoroLen;
      this._pomodoroLabel.innerText = "Pomodoro: " + curPomodoro + " / " + localStorage.pomodoroCount;
      this._extraTimeLabelEl.innerText = "Extra time: " + getTimeFormatted_M_H_adaptive(extraTime);
      this._pomodoroMeterEl.value = localStorage.curProgress;
      this._pomodoroMeterEl.max = localStorage.pomodoroCount * localStorage.pomodoroLen;
   }

   notesShowUpdate() {
      console.log("Updating to: ");
      this._notesDiv.style.display = localStorage.notesOn == 1 ? "flex" : "none";
   }

   //Progress arithmetic

   addProgressTime(amount) {
      if (amount <= 0) return;
      localStorage.curProgress = Number(localStorage.curProgress) + Number(amount);
      const maxVal = localStorage.pomodoroCount * localStorage.pomodoroLen;
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
      if (amount <= 0) return;
      localStorage.curProgress = Number(localStorage.curProgress) - Number(amount);
      this._pomodoroMeterEl.classList.remove("gold");
      if (localStorage.curProgress < 0) {
         localStorage.curProgress = 0;
      }
      if (this._state == StateEnum.DONE) {
         this._state = StateEnum.OFF;
      }
      const maxVal = localStorage.pomodoroCount * localStorage.pomodoroLen;
      if (localStorage.curProgress < maxVal - localStorage.pomodoroLen) {
         this._lastPomodoro = false;
      }
   }

   //Logging

   logEvent(event) {
      this._Logs.addRecord(Date.now(), event, Number(localStorage.curProgress) + Number(this._Timer.getCurTimerTime()));
   }

}
