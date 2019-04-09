// Shorthand for muliple events with the same function
export default function (types, func) {
  var state = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "add";
  types.forEach((type) => {
    document[`${state}EventListener`](type, func);
  });
}
