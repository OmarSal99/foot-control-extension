export async function loadSVG(file) {
  try {
    const response = await fetch(file);
    const svgText = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    // svgElement.setAttribute("fill", fillColor);

    return svgElement;
  } catch (error) {
    console.error("Error loading SVG:", error);
  }
}

// {
//   "name": "Foot pedal",
//   "pid": 2330,
//   "vid": 2321,
//   "modifiable": true,
//   "mapping": [
//     {
//       "input": "1",
//       "output": ["o"]
//     },
//     {
//       "input": "2",
//       "output": ["3", " "]
//     },
//     {
//       "input": "6",
//       "output": ["x", "e", "F5"]
//     }
//   ]
// },
