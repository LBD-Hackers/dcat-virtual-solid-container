"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computeChecksumMd5 = computeChecksumMd5;
exports.parseStream = parseStream;

var SparkMD5 = _interopRequireWildcard(require("spark-md5"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// import { IQueryResultBindings, newEngine } from '@comunica/actor-init-sparql';
function computeChecksumMd5(file) {
  return new Promise((resolve, reject) => {
    const chunkSize = 5242880; // Read in chunks of 5MB

    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    let cursor = 0; // current cursor in file

    fileReader.onerror = function () {
      reject('MD5 computation failed - error reading the file');
    }; // read chunk starting at `cursor` into memory


    function processChunk(chunk_start) {
      const chunk_end = Math.min(file.size, chunk_start + chunkSize);
      fileReader.readAsArrayBuffer(file.slice(chunk_start, chunk_end));
    } // when it's available in memory, process it
    // If using TS >= 3.6, you can use `FileReaderProgressEvent` type instead 
    // of `any` for `e` variable, otherwise stick with `any`
    // See https://github.com/Microsoft/TypeScript/issues/25510


    fileReader.onload = function (e) {
      spark.append(e.target.result); // Accumulate chunk to md5 computation

      cursor += chunkSize; // Move past this chunk

      if (cursor < file.size) {
        // Enqueue next chunk to be accumulated
        processChunk(cursor);
      } else {
        // Computation ended, last chunk has been processed. Return as Promise value.
        // This returns the base64 encoded md5 hash, which is what
        // Rails ActiveStorage or cloud services expect
        // resolve(btoa(spark.end(true)));
        // If you prefer the hexdigest form (looking like
        // '7cf530335b8547945f1a48880bc421b2'), replace the above line with:
        resolve(spark.end());
      }
    };

    processChunk(0);
  });
}

function parseStream(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
    stream.on("error", err => reject(err));
    stream.on("end", () => {
      resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    });
  });
} // export async function getQueryResult(source, property, fetch, single: boolean = false) {
//   const myEngine = newEngine()
//   const q = `SELECT ?res WHERE {<${source}> <${property}> ?res}`
//   const bindings = await myEngine.query(q, {sources: [source], fetch}).then((i: IQueryResultBindings) => i.bindings())
//   if (single) {
//     return bindings[0].get("?res").value
//   } else {
//     return bindings.map(i => i.get("?res").value)
//   }
// }
//# sourceMappingURL=utils.js.map