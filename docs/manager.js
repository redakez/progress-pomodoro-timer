import { getCenteredButtonArray, getCenteredInputTextWithLabel, readIntFromLabel, LoggingEvents } from "./utils.js";

export class Manager {

   constructor(pomTimer) {
      this.PT = pomTimer;
   }

   initInterface(managerDivEl) {
      let timeDivEl = document.createElement("div");
      timeDivEl.classList.add("cent-div")

      this._minuteInputEL = getCenteredInputTextWithLabel(managerDivEl, "10", "Time (min):");

      let buttons = getCenteredButtonArray(managerDivEl, ["Add", "Remove"]);
      buttons[0].addEventListener("click", this.addButtonAction.bind(this));
      buttons[1].addEventListener("click", this.removeButtonAction.bind(this));
   }

   addButtonAction() {
      const val = readIntFromLabel(this._minuteInputEL);
      if (val != null) {
         this.PT.addProgressTime(val * 1000 * 60);
         this.PT.fullInterfaceUpdate();
         this.PT.logEvent(LoggingEvents.AddTime);
      }
   }

   removeButtonAction() {
      const val = readIntFromLabel(this._minuteInputEL);
      if (val != null) {
         this.PT.removeProgressTime(val * 1000 * 60);
         this.PT.fullInterfaceUpdate();
         this.PT.logEvent(LoggingEvents.AddTime);
      }
   }

}