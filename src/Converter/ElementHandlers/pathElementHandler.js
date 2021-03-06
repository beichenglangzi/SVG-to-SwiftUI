import { extractProps } from "../StyleUtilities";
import { format } from "mathjs";

export function handlePathElement(element, options) {
  const { properties, style } = extractProps(element, options);
  options.lastPathId++;

  const dataPointElements = parseDataPoints(properties.d);

  const swiftString = convertPathToSwift(dataPointElements, options);

  return swiftString;
}

function convertPathToSwift(dataPointElements, options) {
  console.log(dataPointElements);
  console.log(options);

  const identation = "        ";

  let swiftString = "";
  for (const el of dataPointElements) {
    // Flatten data.
    el.data = [].concat.apply([], el.data);

    // Handle data depending on command type.
    switch (el.command.toUpperCase()) {
      case "M":
        swiftString +=
          identation + generateMoveToSwift(el.data, options) + "\n";
        break;
      case "L":
        swiftString +=
          identation + generateLineToSwift(el.data, options) + "\n";
        break;
      case "H":
        break;
      case "V":
        break;
      case "C":
        swiftString +=
          identation + generateCubicCurveSwift(el.data, options) + "\n";
        break;
      case "S":
        break;
      case "Q":
        break;
      case "T":
        break;
      case "A":
        break;
      case "Z":
        swiftString += identation + generateClosePathSwift([], options) + "\n";
        break;
      default:
        console.error(
          `Unsupported path data point, please consider contributing on Github to help bring ${el.command} to this tool.`
        );
    }
  }

  return swiftString;
}

function parseDataPoints(dStr) {
  let elements = [];

  let lastElementId;

  for (let i = 0; i < dStr.length; i++) {
    if (/[m|l|h|v|c|s|q|t|a|z]/i.test(dStr[i])) {
      // New command.
      lastElementId = elements.length;
      elements.push([dStr[i]]);
    } else {
      // Continue adding to the previous command
      if (elements[lastElementId].length == 1) {
        elements[lastElementId].push(dStr[i]);
      } else {
        elements[lastElementId][1] += dStr[i];
      }
    }
  }

  elements = elements.map((el) => {
    const command = el[0];
    if (el.length > 1) {
      const data = el[1]
        .trim()
        .split(" ")
        .map((val) =>
          val
            .trim()
            .split(",")
            .map((v) => parseFloat(v))
        );
      return { command, data };
    } else {
      return { command };
    }
  });

  return elements;
}

function handleZeroAndOneValues(value_x, value_y) {
  let filtered_x = "";
  let filtered_y = "";

  if (value_x == 0) {
    filtered_x = "0";
  } else if (value_x == 1) {
    filtered_x = "width";
  } else {
    filtered_x = `${value_x}*width`;
  }

  if (value_y == 0) {
    filtered_y = "0";
  } else if (value_y == 1) {
    filtered_y = "height";
  } else {
    filtered_y = `${value_y}*height`;
  }

  return [filtered_x, filtered_y];
}

function generateMoveToSwift(data, options) {
  const [x, y] = data;
  const fmtOpts = {
    notation: "fixed",
    precision: options.numberPrecision,
  };

  const px = parseFloat(format(x / options.viewBox.width, fmtOpts));
  const py = parseFloat(format(y / options.viewBox.height, fmtOpts));

  const [new_x, new_y] = handleZeroAndOneValues(px, py);

  return `path.move(to: CGPoint(x: ${new_x}, y: ${new_y}))`;
}

function generateLineToSwift(data, options) {
  const [x, y] = data;
  const fmtOpts = {
    notation: "fixed",
    precision: options.numberPrecision,
  };

  const px = parseFloat(format(x / options.viewBox.width, fmtOpts));
  const py = parseFloat(format(y / options.viewBox.height, fmtOpts));

  const [new_x, new_y] = handleZeroAndOneValues(px, py);

  return `path.addLine(to: CGPoint(x: ${new_x}, y: ${new_y}))`;
}

function generateClosePathSwift(data, options) {
  return `path.closeSubpath()`;
}

function generateCubicCurveSwift(data, options) {
  let [p2x, p2y, p3x, p3y, p1x, p1y] = data;
  const fmtOpts = {
    notation: "fixed",
    precision: options.numberPrecision,
  };

  // Convert raw values into width/height relative values.
  p1x = parseFloat(format(p1x / options.viewBox.width, fmtOpts));
  p1y = parseFloat(format(p1y / options.viewBox.height, fmtOpts));

  p2y = parseFloat(format(p2y / options.viewBox.height, fmtOpts));
  p2x = parseFloat(format(p2x / options.viewBox.width, fmtOpts));

  p3x = parseFloat(format(p3x / options.viewBox.width, fmtOpts));
  p3y = parseFloat(format(p3y / options.viewBox.height, fmtOpts));

  // Prepare string values.
  const [p1x_str, p1y_str] = handleZeroAndOneValues(p1x, p1y);
  const [p2x_str, p2y_str] = handleZeroAndOneValues(p2x, p2y);
  const [p3x_str, p3y_str] = handleZeroAndOneValues(p3x, p3y);

  return [
    `path.addCurve(to: CGPoint(x: ${p1x_str}, y: ${p1y_str}),`,
    `control1: CGPoint(x: ${p2x_str}, y: ${p2y_str}),`,
    `control2: CGPoint(x: ${p3x_str}, y: ${p3y_str}))`,
  ].join("");
}
