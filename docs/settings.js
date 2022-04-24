import { readIntFromLabel, LoggingEvents } from "./utils.js";

export class Settings {

   //Constructor and initialization

   constructor(pomTimer) {
      this.PT = pomTimer;
   }

   initInterface(managerDivEl) {
      //Pomodoro count input
      let pomCountDivEl = document.createElement("div");
      pomCountDivEl.classList.add("cent-div")

      let pomCountLabelEl = document.createElement("label");
      pomCountLabelEl.textContent = "Pomodoro count:";
      this._pomCountInputEl = document.createElement("input");
      this._pomCountInputEl.type = "text";
      pomCountDivEl.appendChild(pomCountLabelEl);
      pomCountDivEl.appendChild(this._pomCountInputEl);

      managerDivEl.appendChild(pomCountDivEl);

      //Pomodoro length input
      let pomLenDivEl = document.createElement("div");
      pomLenDivEl.classList.add("cent-div")

      let pomLenLabelEl = document.createElement("label");
      pomLenLabelEl.textContent = "Pomodoro length (min):";
      this._pomLenInputEl = document.createElement("input");
      this._pomLenInputEl.type = "text";
      pomLenDivEl.appendChild(pomLenLabelEl);
      pomLenDivEl.appendChild(this._pomLenInputEl);

      managerDivEl.appendChild(pomLenDivEl);

      //Confirm button
      let buttonDivEL = document.createElement("div");
      buttonDivEL.classList.add("cent-div")

      let confirmButtonEl = document.createElement("button");
      confirmButtonEl.textContent = "Apply";
      confirmButtonEl.addEventListener("click", e => this.applySettings());
      buttonDivEL.appendChild(confirmButtonEl);

      managerDivEl.appendChild(buttonDivEL);

      //Break
      managerDivEl.appendChild(document.createElement("br"));

      //Notifications tickbox
      let checkboxDivEL = document.createElement("div");
      checkboxDivEL.classList.add("cent-div")

      this._checkboxEl = document.createElement("input");
      this._checkboxEl.type = "checkbox";
      this._checkboxEl.id = "notifCheckbox";
      this._checkboxEl.checked = localStorage.notifOn == 1;
      this._checkboxEl.addEventListener("click", (e) => this.checkboxAction(e), false);
      checkboxDivEL.appendChild(this._checkboxEl);

      let labelEL = document.createElement("label");
      labelEL.textContent = "Desktop notifications";
      labelEL.setAttribute("for", "notifCheckbox");
      checkboxDivEL.appendChild(labelEL);

      managerDivEl.appendChild(checkboxDivEL);
   }

   applySettings() {
      //Try to read the label info
      let newPomodorCount = readIntFromLabel(this._pomCountInputEl);
      if (newPomodorCount == null) {
         return;
      }
      let newPomodorLen = readIntFromLabel(this._pomLenInputEl);
      if (newPomodorLen == null) {
         return;
      }
      //If the format is correct, apply the settings
      let progressSave = localStorage.curProgress;
      this.PT.removeProgressTime(progressSave);
      localStorage.pomodoroCount = newPomodorCount;
      localStorage.pomodoroLen = newPomodorLen * 1000 * 60;
      this.PT.addProgressTime(progressSave);
      this.PT.fullInterfaceUpdate();
      this.PT.logEvent(LoggingEvents.SettingsChanged);
   }

   checkboxAction(e) {
      //If the permision has no been granted, then prevent defaults... (how about that genies?)
      console.log("Cur perm: " + Notification.permission + ", " + "cur localstorage: " + localStorage.notifOn)

      if (Notification.permission == "granted") {
         localStorage.notifOn = this._checkboxEl.checked ? 1 : 0;
         console.log("Storage notif set to :" + localStorage.notifOn)
         return;
      }
      e.preventDefault();

      //Request notifications
      if (!("Notification" in window)) {
         alert("Your browser does not support desktop notifications.");
      } else if (Notification.permission == "denied") {
         alert("Desktop notificitaions have been previously disabled for this site and have to be reenabled manually in your browser.");
      } else if (Notification.permission == "default") {
         Notification.requestPermission().then(function (perm) {
            if (perm == "granted") {
               localStorage.notifOn = 1;
               this._checkboxEl.checked = true;
            }
         }.bind(this));
      }
   }

   /*
   switchCheckbox() {
      if (localStorage.notifOn == 1) {
         localStorage.notifOn = 0;
      } else {
         localStorage.notifOn = 1;
      }
      console.log("Storage notif set to :" + localStorage.notifOn)
      //this.updateCheckboxChecked();
   }
   */

}