let data = {
  grabElement: null,
  moveElement: null,
  axis: "all",

  isStyleAdded: false,

  transform: {
    declared: false,
    string: ""
  },

  initialX: 0,
  initialY: 0,

  cursorInitialX: 0,
  cursorInitialY: 0
}

let stylesheet = ".drag-draggable { position: relative; } .drag-draggable:not(.drag-uses-handle), .drag-handle { cursor: move; cursor: grab; cursor: -webkit-grab; cursor: -moz-grab; } .drag-handle.drag-down, .drag-draggable:not(.drag-uses-handle).drag-down { z-index: 999; cursor: grabbing; cursor: -webkit-grabbing; cursor: -moz-grabbing; }"

function returnPositionString(a, b) {
  return `matrix(${data.transform.string}, ${a}, ${b})`
}

function getPosition(str, el, dir) {
  let list = getMatrixSection(str)
  let pos = parseInt(window.getComputedStyle(el)[dir].slice(0, -2));


  if (dir === "left" && str !== "none") {
    pos += parseInt(str.slice(list[3] + 2, list[4]));
  } else if (dir === "top" && str !== "none") {
    pos += parseInt(str.slice(list[4] + 2, -1));
  }

  return pos;
}

function getMatrixSection(str) {
  let list = [], i;
  for(i = 0; i < str.length; i++) {
    if (str[i] === ",") {
      list.push(i);
    }
  }
  return list;
}

/* --- Start dragging ---------- */
function dragDown(axis, grabElement, moveElement, e) {

  data.grabElement = grabElement;
  data.moveElement = moveElement;

  data.axis = axis || "all";

  data.cursorInitialX = e.pageX || e.touches[0].pageX;
  data.cursorInitialY = e.pageY || e.touches[0].pageY;

  data.relativeX = 0;
  data.relativeY = 0;

  let matrix = window.getComputedStyle(moveElement).transform;

  if (matrix == "none") {
    data.transform.declared = false;
    data.transform.string = "1, 0, 0, 1";
  } else {
    data.transform.declared = true;
    data.transform.string = matrix.slice(7, getMatrixSection(matrix)[3]);
  }

  data.initialX = getPosition(matrix, moveElement, "left");
  data.initialY = getPosition(matrix, moveElement, "top");

  moveElement.style.transform = returnPositionString(data.initialX, data.initialY);
  moveElement.style.left = 0;
  moveElement.style.top = 0;

  grabElement.classList.add("drag-down");

  document.addEventListener("mousemove", updatePosition)
  document.addEventListener("touchmove", updatePosition)
}

/* --- Dragging ---------- */
function updatePosition(e) {
  let x = (e.pageX || e.touches[0].pageX) - data.cursorInitialX;
  let y = (e.pageY || e.touches[0].pageY) - data.cursorInitialY;

  data.moveElement.classList.add("drag-move");

  if (data.axis == "x") {
    y = 0;
  } else if (data.axis == "y") {
    x = 0;
  }

  data.moveElement.style.transform = returnPositionString(data.initialX + x, data.initialY + y);

  data.relativeX = x;
  data.relativeY = y;
}

/* --- End dragging ---------- */
function dragUp() {
  if (data.moveElement) {
    data.moveElement.style.transform = data.transform.declared ? returnPositionString(0, 0) : "none";
    data.moveElement.style.left = data.initialX + data.relativeX + "px";
    data.moveElement.style.top = data.initialY + data.relativeY + "px";

    data.grabElement.classList.remove("drag-down");
    data.moveElement.classList.remove("drag-move");

    document.removeEventListener("mousemove", updatePosition);
    document.removeEventListener("touchmove", updatePosition);
  }
}

const vueTouch = {
  install(Vue, options) {
    Vue.directive("drag", {
      inserted: function(el, binding, vnode) {
        let val = binding.value;
        let axis, handle, grabElement, moveElement;

        /* Creates stylesheet with basic styling (position, z-index and cursors) */
        if (!data.isStyleAdded) {
          data.isStyleAdded = true;

          let styleElement = document.createElement("style");
          styleElement.innerHTML = stylesheet;
          document.body.appendChild(styleElement);
        }

        if (val instanceof Object) {
          axis = val.axis;
          handle = val.handle;
        } else {
          axis = binding.arg;
          handle = val;
        }

        let valueElement = document.getElementById(handle);

        if (val && !valueElement && val.handle) {
          console.error(`Element with id “${val.handle || val}” doesn’t exist`);
        } else {
          if (valueElement) {
            grabElement = valueElement;
            moveElement = el;
            moveElement.classList.add("drag-uses-handle");
            grabElement.classList.add("drag-handle");
          } else {
            grabElement = el;
            moveElement = el;
          }

          moveElement.classList.add("drag-draggable");

          /* Start dragging */
          grabElement.addEventListener("mousedown", e => dragDown(axis, grabElement, moveElement, e));
          grabElement.addEventListener("touchstart", e => dragDown(axis, grabElement, moveElement, e));
        }

        /* End dragging */
        document.addEventListener("mouseup", dragUp);
        document.addEventListener("touchend", dragUp);
      }
    })
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(vueTouch)
} else {
  module.exports = vueTouch
}