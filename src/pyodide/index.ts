
// // import "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js";
// import {loadPyodide} from "./pyodide/pyodide";

// // const pack = await import("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");

// const pyodide = await loadPyodide();
// await pyodide.loadPackage("micropip");

// await pyodide.runPythonAsync(`
// # workaround presented by https://github.com/pyodide/pyodide/issues/1603#issuecomment-850794345 
// import sys
// sys.modules["_multiprocessing"] = object()

// import micropip
// await micropip.install("colour-science")
// `);

// const colour = pyodide.pyimport("colour");