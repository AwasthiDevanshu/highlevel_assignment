const { parse } = require('csv-parse');
const { promisify } = require('util');

const parseCSV = async (buffer) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', (err) => {
      reject(err);
    });

    parser.on('end', () => {
      resolve(records);
    });

    parser.write(buffer);
    parser.end();
  });
};

module.exports = { parseCSV }; 