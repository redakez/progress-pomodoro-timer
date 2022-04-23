import { readIntFromLabel, LoggingEvents } from "./utils.js";

export class Settings {

   //Constructor and initialization

   constructor(pomTimer) {
      this.PT = pomTimer;
   }

   initInterface(managerDivEl) {
      //Pomodoro count input
      let pomCountDivEl = document.createElement("div");
      pomCountDivEl.classList.add("btn-cent-div")

      let pomCountLabelEl = document.createElement("label");
      pomCountLabelEl.textContent = "Pomodoro count:";
      this._pomCountInputEl = document.createElement("input");
      pomCountDivEl.appendChild(pomCountLabelEl);
      pomCountDivEl.appendChild(this._pomCountInputEl);

      managerDivEl.appendChild(pomCountDivEl);

      //Pomodoro length input
      let pomLenDivEl = document.createElement("div");
      pomLenDivEl.classList.add("btn-cent-div")

      let pomLenLabelEl = document.createElement("label");
      pomLenLabelEl.textContent = "Pomodoro length:";
      this._pomLenInputEl = document.createElement("input");
      pomLenDivEl.appendChild(pomLenLabelEl);
      pomLenDivEl.appendChild(this._pomLenInputEl);

      managerDivEl.appendChild(pomLenDivEl);

      //Confirm button
      let buttonDivEL = document.createElement("div");
      buttonDivEL.classList.add("btn-cent-div")

      let confirmButtonEl = document.createElement("button");
      confirmButtonEl.textContent = "Apply";
      confirmButtonEl.classList.add("timer-btn")
      confirmButtonEl.addEventListener("click", e => this.applySettings());
      buttonDivEL.appendChild(confirmButtonEl);

      managerDivEl.appendChild(buttonDivEL);
   }

   applySettings() {
      let newPomodorCount = readIntFromLabel(this._pomCountInputEl);
      if (newPomodorCount == null) {
         return;
      }
      let newPomodorLen = readIntFromLabel(this._pomLenInputEl);
      if (newPomodorLen == null) {
         return;
      }
      let progressSave = localStorage.curProgress;
      this.PT.removeProgressTime(progressSave);
      localStorage.pomodoroCount = newPomodorCount;
      localStorage.pomodoroLen = newPomodorLen * 1000 * 60;
      this.PT.addProgressTime(progressSave);
      this.PT.fullInterfaceUpdate();
      this.PT.logEvent(LoggingEvents.SettingsChanged);
   }

}