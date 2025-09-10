function transpose<T>(cycles: (T | T[])[][], baseNote: number) {
  return cycles.map((cycle) =>
    cycle.map((item) => {
      if (Array.isArray(item)) {
        // If item is an array, recursively transpose each element
        return item.map((subItem) =>
          typeof subItem === "number" ? subItem - baseNote : subItem
        );
      } else {
        // If item is a single value, transpose if it's a number
        return typeof item === "number" ? item - baseNote : item;
      }
    })
  );
}

export { transpose };
