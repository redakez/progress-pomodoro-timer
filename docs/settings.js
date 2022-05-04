import { getCenteredButtonArray, getCenteredInputTextWithLabel, getCenteredCheckboxWithLabel, readIntFromLabel, LoggingEvents } from "./utils.js";

export class Settings {

   //Constructor and initialization

   constructor(pomTimer) {
      this.PT = pomTimer;
   }

   initInterface(settingsDivEl) {
      //Pomodoro count input
      getCenteredInputTextWithLabel
      this._pomCountInputEl = getCenteredInputTextWithLabel(settingsDivEl, 8, "Pomodoro count:");
      this._pomLenInputEl = getCenteredInputTextWithLabel(settingsDivEl, 30, "Pomodoro length (min):");

      //Confirm button
      let buttons = getCenteredButtonArray(settingsDivEl, ["Apply"]);
      buttons[0].addEventListener("click", () => this.applySettings());

      //Break
      settingsDivEl.appendChild(document.createElement("br"));

      //Notifications checkbox
      this._checkboxEl = getCenteredCheckboxWithLabel(settingsDivEl, "notif", localStorage.notifOn == 1, "Desktop notifications");
      this._checkboxEl.addEventListener("click", (e) => this.checkBoxAction(e, "notifOn", this._checkboxEl), false);

      //Eye rest checkbox
      this._eyeCheckboxEl = getCenteredCheckboxWithLabel(settingsDivEl, "eye", localStorage.eyeNotifOn == 1, "Eye rest notifications");
      this._eyeCheckboxEl.addEventListener("click", (e) => this.checkBoxAction(e, "eyeNotifOn", this._eyeCheckboxEl), false);

      //Notes checkbox
      this._notesCheckboxEl = getCenteredCheckboxWithLabel(settingsDivEl, "notes", localStorage.notesOn == 1, "Notes text area");
      this._notesCheckboxEl.addEventListener("click", (e) => {
         localStorage.notesOn = this._notesCheckboxEl.checked ? 1 : 0;
         this.PT.notesShowUpdate();
      });
   }

   applySettings() {
      //Try to read the label info
      const newPomodorCount = readIntFromLabel(this._pomCountInputEl);
      if (newPomodorCount == null) {
         return;
      }
      const newPomodorLen = readIntFromLabel(this._pomLenInputEl);
      if (newPomodorLen == null) {
         return;
      }
      //If the format is correct, apply the settings
      const progressSave = localStorage.curProgress;
      this.PT.removeProgressTime(progressSave);
      localStorage.pomodoroCount = newPomodorCount;
      localStorage.pomodoroLen = newPomodorLen * 1000 * 60;
      this.PT.addProgressTime(progressSave);
      this.PT.fullInterfaceUpdate();
      this.PT.logEvent(LoggingEvents.SettingsChanged);
   }

   checkBoxAction(e, localStorageOptionName, checkboxEl) {
      if (Notification.permission == "granted") {
         let curVal = localStorage.getItem(localStorageOptionName);
         localStorage.setItem(localStorageOptionName, curVal == 0 ? 1 : 0);
         return;
      }
      e.preventDefault();

      //Request notifications
      if (!("Notification" in window)) {
         alert("Your browser does not support desktop notifications.");
      } else if (Notification.permission == "denied") {
         alert("Desktop notificitaions have been previously disabled for this site and have to be re-enabled manually in your browser.");
      } else if (Notification.permission == "default") {
         Notification.requestPermission().then((perm) => {
            if (perm == "granted") {
               localStorage.setItem(localStorageOptionName, 1);
               checkboxEl.checked = true;
            } else {
               this.disableAllDesktopNotifications();
            }
         });
      }
   }

   disableAllDesktopNotifications() {
      localStorage.notifOn = 0;
      localStorage.eyeNotifOn = 0;
      this._checkboxEl.checked = false;
      this._eyeCheckboxEl.checked = false;
   }

}