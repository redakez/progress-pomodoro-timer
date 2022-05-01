import { LoggingEvents, getTimeFormatted_S_H, getTimeFormatted_M_H_adaptive, getTimeFormatted_M_H } from "./utils.js";

export class Logs {

   //Constructor and initialization

   constructor(pomTimer) {
      this.PT = pomTimer;
      this._records = [];
   }

   initInterface(logsDivEl) {
      let tableDivEl = document.createElement("div");
      tableDivEl.classList.add("table-div");

      // Buttons (Clear records + save records)
      let btnsDivEl = document.createElement("div");
      btnsDivEl.classList.add("cent-div")

      let clearButtonEl = document.createElement("button");
      clearButtonEl.textContent = "Clear";
      clearButtonEl.addEventListener("click", this.clearRecordsAction.bind(this));
      let saveButtonEl = document.createElement("button");
      saveButtonEl.textContent = "Save";
      saveButtonEl.addEventListener("click", this.saveRecordsToFileAction.bind(this));
      btnsDivEl.appendChild(clearButtonEl);
      btnsDivEl.appendChild(saveButtonEl);

      logsDivEl.appendChild(btnsDivEl);

      //SVG graph
      this._svgGraph = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      this._svgGraphXSize = 280; //Entire graph horizontal size in pixels
      this._svgGraphYSize = 150; //Entire graph vertical   size in pixels
      this._mainOffset = 30; //Extra space on the bottom and the  left of the graph
      this._sideOffset = 10; //Extra space on the top    and the right of the graph
      this._textOffset = 20; //Bottom text offset, used for centering text on ticks
      this._tickLength = 10; //Length of ticks

      this._svgGraph.setAttribute("viewBox", "0 0 " + this._svgGraphXSize + " " + this._svgGraphYSize)
      this._svgGraph.id = "logGraph";
      logsDivEl.appendChild(this._svgGraph);

      //Table
      this._table = document.createElement("table");

      tableDivEl.appendChild(this._table);
      logsDivEl.appendChild(tableDivEl);
   }

   clearRecordsAction() {
      const res = confirm("Are you sure you want to clear today's records?")
      if (res) {
         this._records = [];
         this.PT.logEvent(LoggingEvents.RecordsClear);
      }
   }

   saveRecordsToFileAction() {
      let fileContent = [];
      fileContent.push("Timestamp,Action,Progress [ms]\n");
      for (const record of this._records) {
         fileContent.push(record.time + "," + record.event + "," + record.progress + "\n");
      }
      let file = new Blob([fileContent.join("")], { type: "text/csv" });
      let a = document.createElement("a")
      let url = URL.createObjectURL(file);
      a.href = url;
      a.download = "progress_pomodoro_timer_records_" + Date.now() + ".csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(e => {
         document.body.removeChild(a);
         window.URL.revokeObjectURL(url);
      }, 0);
   }

   loadFromLocalStorage() {
      if (localStorage.records != null) {
         this._records = JSON.parse(localStorage.records);
      }
   }

   saveToLocalStorage() {
      localStorage.records = JSON.stringify(this._records);
   }

   localUiUpdate() {
      this.updateTable();
      this.updateGraph();
   }

   addRecord(time, type, progress) {
      this._records.push({ time: time, event: type, progress: progress });
      this.localUiUpdate();
   }

   updateTable() {
      let finalInnerHtml = "<thead><tr><th>Time</th><th>Action</th><th>Progress</th></tr></thead><tbody>";
      for (const record of this._records) {
         finalInnerHtml += "<tr><td>" + getTimeFormatted_S_H(record.time) +
            "</td><td>" + record.event +
            "</td><td>" + getTimeFormatted_M_H_adaptive(record.progress) + "</td></tr>";
      }
      finalInnerHtml += "</tbody>";
      this._table.innerHTML = finalInnerHtml;
   }

   updateGraph() {
      const timeShift = this._records[0].time;
      const maxTime = this._records[this._records.length - 1].time - timeShift;
      const maxVal = Number(localStorage.getItem("pomodoroLen")) * Number(localStorage.getItem("pomodoroCount"));
      this._svgGraph.innerHTML = "";

      const fullOffset = this._mainOffset + this._sideOffset;

      //Main progress path
      if (this._records.length > 1) {
         let fullPath = "M";
         for (let i = 0; i < this._records.length; i++) {
            const thisRec = this._records[i];
            const actualX = (((thisRec.time - timeShift) / maxTime) * (this._svgGraphXSize - fullOffset)) + this._mainOffset;
            const actualY = - ((thisRec.progress / maxVal) * (this._svgGraphYSize - fullOffset)) + (this._svgGraphYSize - this._mainOffset);
            fullPath += actualX + " " + actualY + " L ";
         }
         fullPath = fullPath.substring(0, fullPath.length - 2);
         this._svgGraph.innerHTML += `<path d="${fullPath}" fill="none" stroke="lightgreen" stroke-width="3" />`; //Main progress Line
      }


      //Axes
      this._svgGraph.innerHTML += `<line x1="${this._mainOffset - this._tickLength}" y1="${this._svgGraphYSize - this._mainOffset}"
            x2="${this._svgGraphXSize}" y2="${this._svgGraphYSize - this._mainOffset}" stroke="white" stroke-width="2" />`; //Horizontal line + tick
      this._svgGraph.innerHTML += `<line x1="${this._mainOffset}" y1="0" x2="${this._mainOffset}"
            y2="${this._svgGraphYSize - this._mainOffset}" stroke="white" stroke-width="2" />`; //Vertical line (no tick)

      //X axis text + ticks
      const minXVal = this._mainOffset;
      const maxXVal = this._svgGraphXSize - this._sideOffset;
      const numberOfTimeTicks = 4;
      for (let xVal = minXVal; xVal <= maxXVal; xVal += (maxXVal - this._mainOffset) / numberOfTimeTicks) {
         //Tick
         this._svgGraph.innerHTML += `<line x1="${xVal}" y1="${this._svgGraphYSize - this._mainOffset}
               " x2="${xVal}" y2="${this._svgGraphYSize - this._mainOffset + this._tickLength}" stroke="white" stroke-width="2" />`;
         //Tick label
         let time = Math.floor(timeShift + (maxTime * ((xVal - minXVal) / (maxXVal - minXVal))));
         this._svgGraph.innerHTML += `<text x="${Math.min(maxXVal - this._textOffset - 12, xVal - this._textOffset)}
               " y="${this._svgGraphYSize - this._mainOffset + this._tickLength + 15}" class="svgText">${getTimeFormatted_M_H(time)}</text>`;
      }

      //Y axis text + tick
      this._svgGraph.innerHTML += `<text x="${this._mainOffset - this._tickLength - 15}" y="${this._sideOffset + 5}" class="svgText" ">F</text>`;
      this._svgGraph.innerHTML += `<text x="${this._mainOffset - this._tickLength - 15}"
             y="${this._svgGraphYSize - this._mainOffset + 5}" class="svgText">0</text>`;
      this._svgGraph.innerHTML += `<line x1="${this._mainOffset - this._tickLength}" y1="${this._sideOffset}"
            x2="${this._mainOffset}" y2="${this._sideOffset}" stroke="white" stroke-width="2" />`; //Goal dash
   }

}