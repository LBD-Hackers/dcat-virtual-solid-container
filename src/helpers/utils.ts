import * as SparkMD5 from 'spark-md5';
// import { IQueryResultBindings, newEngine } from '@comunica/actor-init-sparql';

export function computeChecksumMd5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunkSize = 5242880; // Read in chunks of 5MB
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
  
      let cursor = 0; // current cursor in file
  
      fileReader.onerror = function(): void {
        reject('MD5 computation failed - error reading the file');
      };
  
      // read chunk starting at `cursor` into memory
      function processChunk(chunk_start: number): void {
        const chunk_end = Math.min(file.size, chunk_start + chunkSize);
        
        fileReader.readAsArrayBuffer(file.slice(chunk_start, chunk_end));
      }
  
      // when it's available in memory, process it
      // If using TS >= 3.6, you can use `FileReaderProgressEvent` type instead 
      // of `any` for `e` variable, otherwise stick with `any`
      // See https://github.com/Microsoft/TypeScript/issues/25510
      fileReader.onload = function(e: any): void {
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

export function parseStream(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () =>{
      resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
    });
  });
}

// export async function getQueryResult(source, property, fetch, single: boolean = false) {
//   const myEngine = newEngine()
//   const q = `SELECT ?res WHERE {<${source}> <${property}> ?res}`
//   const bindings = await myEngine.query(q, {sources: [source], fetch}).then((i: IQueryResultBindings) => i.bindings())
//   if (single) {
//     return bindings[0].get("?res").value
//   } else {
//     return bindings.map(i => i.get("?res").value)
//   }
// }