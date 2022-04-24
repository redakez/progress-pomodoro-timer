export let StateEnum = { OFF: 0, RUNNING: 1, PAUSED: 2, FINISHED: 3, DONE: 4 }

export let LoggingEvents = {
   AppLoad: "AppLoad",
   TimerStart: "TStart",
   TimerFinish: "TFinish",
   TimerPause: "TPause",
   TimerResume: "TResume",
   AddTime: "AddTime",
   RemoveTime: "RemTime",
   SettingsChanged: "Settings"
}

export function readIntFromLabel(label) {
   let errMsg = "Please input a positive integer value";
   if (isNaN(label.value) || label.value == "") {
      alert(errMsg);
      return null;
   }
   let intVal = parseInt(label.value);
   if (intVal <= 0) {
      alert(errMsg);
      return null;
   }
   return intVal;
}

function getNumberZeroPadded(number, amount) {
   return String(number).padStart(amount, '0');
}

export function getTimeFormatted_adaptive(timeMs) {
   let theTime = new Date(Number(timeMs));
   let hours = Math.floor(timeMs / (1000 * 60 * 60));
   let minutes = theTime.getMinutes();
   let seconds = theTime.getSeconds();
   let milliSeconds = theTime.getMilliseconds();

   let ret = "";
   if (hours != 0) {
      ret += getNumberZeroPadded(hours, 2) + ":";
   }
   ret += getNumberZeroPadded(minutes, 2) + ":" + getNumberZeroPadded(seconds, 2) + "." + getNumberZeroPadded(milliSeconds, 3);
   return ret;
}

export function getTimeFormatted_M_H(timeMs) {
   let theTime = new Date(Number(timeMs));
   return getNumberZeroPadded(theTime.getHours(), 2) + ":" +
      getNumberZeroPadded(theTime.getMinutes(), 2)
}

export function getTimeFormatted_S_H(timeMs) {
   let theTime = new Date(Number(timeMs));
   return getNumberZeroPadded(theTime.getHours(), 2) + ":" +
      getNumberZeroPadded(theTime.getMinutes(), 2) + ":" +
      getNumberZeroPadded(theTime.getSeconds(), 2)
}

export function getTimeFormatted_Ms_M(timeMs) {
   let theTime = new Date(Number(timeMs));
   return getNumberZeroPadded(theTime.getMinutes(), 2) + ":" +
      getNumberZeroPadded(theTime.getSeconds(), 2) + "." +
      getNumberZeroPadded(theTime.getMilliseconds(), 3);
}

/* 32x32px icon in Base64 | Thanks https://b64.io/ | file size: 1.5ko | optimized file size: 1.3ko | base64 size: 1.8ko */
export let iconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAE6ElEQVR42tWXA9QsuxKFk3T32OZv2zi2bdvvXdu2bdu2jnFt27ZVd6ePf/fM5V7rm5lWaldVktXD/q06QPFo3wmb8gh+TwQmlppsoA40M8HNzIA+dE2MkHtajOyDA4Tj57hZGDUxFbxnbfb+bm1wyzF2YQZ0MrL/DN+POocHyTkuLAd4FvjAZsXBAjAY2IAuJWAS+DpUy7RS6Lgi2hT8EcZZT9ZlKZzj08tNQn5fHdgvl7z/y5QDfSCcqmAQV/nnngUJsjbqAd4Hrs3mLbVuSt5UQ5Zql7y2L4IrLA3VqXHLLxl31JJjSFAOeCG4wT01RolrqyjjzjqC4d9xLhsMN+XZKXFDNbmnx+S9K9mfpA+DB+ZR/KpKMpc7f0N7KHFNFcWvrKTw0YUy0E9MoCWcUfiUYopdUkHCrnzRUY3BNJDJthFn7WuAFWWNX1FJoWMKKXgwzGw0gBZ4pIFh4Fbv0gxK3lJD7qnR9iZdOThLS1rIWq+37hfAzgerWSfiFvGKzEwG3RbFpb6Ay/NtzR69QrHLKuTAP7bMDpqHOUWBfXLI1sMr2ybvu4wJh/KeFjPLg6WsYy1xDA3+Lvu7rQG5WoRFUPTsUv3YNVnP/mqwreYj618D++aSGrPI+bI/WqZuGdjWzy8f+hjEWPvygR9iF5VvZ4AjePikYj37OLJXExbaZuMaAd5Sw2aScwi/vwElbe1Wb7rGhAlr91f8XgFOBFNAHthWt3oWJbczEDo8n+JXV+oGIicW65sWOEc41E/s/f0UOqKAQkcWyEp9wTirbKfBLMk18bucYHH02bsoQZYyJ8mecYX/ygS/E3ctA2Nt3b0ycCvQGvTWR2rQRP6ds2CoimLnl5Gtl0+W/HM9mU6UBV609fZR4IBcSt5cow8qy+vfM5vcM2MkNxg72oXV0NrE1VXY+QopilXg2ymLzMUOWY3lYDpTuJ0Z0AzwAvjW3tf/e+SMEopfXiFLLJee3HzargBMVZxRRkOzXWRlTAY/gRlUGBRscxwBwzlnD7I8G/VblkMZl8tgrYlgDvQ+spgurozSFVVRmjclk7onndLEeo1zF+tEVvR4tZzN3AzQdybYFZt65hCMPXVY0E3HDcmg3IsqKIZKbCbn4goqP7OMxu1RQEvm5tD+YzLp6IFJuiMRpMd8AZputXapEplc5aT4NFK82rvYF8hcaCdzmfM3HH+WmBCl0nPKyXUr5sN1VXqmyxDs5J5xuqo4TA8E/bTK7aOVHh+t8Pp1lvv89JDfT/eBuKIQZyzYefk3i+vL8irFo37lXZikUQcX0/9n5ejlXW/30lqnj1YhGAJ0ynIww2bbuOOloOHVQv3l0RZZGeU6r1ca+ITL/cagxi2G+9WBgBwoZR7D83YhvsN4hcyg5uzrcNCqNIJLNsBAtab9jPHqmUFN2dFup9VpGlgPA7UbDTQwg+ozyGz+dV2aLXgUz9s4ly0oYAaVVPFgOnNgObjAvfGdUTCmsRS0Zne0YXmKBh4E3U0maWAHYFxwHY8IQfekEHwVOAfZK/J1Pk0tyFMUw8vxeqx/zrmcfLUgbe2fp6p0NjKSy2pFB1mvxfVDnE7yCCHfC8ewP1FN4NsaTaPzPJ4tPZY8AGSbDsC+EVUU2fM3QIL92TJxLuQOCU7VOH8wKsSzcUV5wSuE/BN7IzgI9GL/Jf0BZrMVxPhXj8kAAAAASUVORK5CYII=";