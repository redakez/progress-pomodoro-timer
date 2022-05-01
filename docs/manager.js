import { readIntFromLabel, LoggingEvents } from "./utils.js";

export class Manager {

   constructor(pomTimer) {
      this.PT = pomTimer;
   }

   initInterface(managerDivEl) {
      let timeDivEl = document.createElement("div");
      timeDivEl.classList.add("cent-div")

      let minuteLabelEl = document.createElement("label");
      minuteLabelEl.textContent = "Time (min):";
      this._minuteInputEL = document.createElement("input");
      this._minuteInputEL.setAttribute("placeholder", "10");
      this._minuteInputEL.type = "text";
      timeDivEl.appendChild(minuteLabelEl);
      timeDivEl.appendChild(this._minuteInputEL);

      managerDivEl.appendChild(timeDivEl);

      let btnsDivEl = document.createElement("div");
      btnsDivEl.classList.add("cent-div")

      let addButtonEl = document.createElement("button");
      addButtonEl.textContent = "Add";
      addButtonEl.addEventListener("click", this.addButtonAction.bind(this));
      let removeButtonEl = document.createElement("button");
      removeButtonEl.textContent = "Remove";
      removeButtonEl.addEventListener("click", this.removeButtonAction.bind(this));
      btnsDivEl.appendChild(addButtonEl);
      btnsDivEl.appendChild(removeButtonEl);

      managerDivEl.appendChild(btnsDivEl);
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