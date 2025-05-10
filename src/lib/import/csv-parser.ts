import Papa from 'papaparse';

export interface ParsedCSVData {
  [key: string]: string;
}

/**
 * Parses a CSV file and returns the data as an array of objects.
 * @param file - The CSV file to parse
 * @returns Promise resolving to an array of parsed data objects
 */
export function parseCSV(file: File): Promise<ParsedCSVData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedCSVData>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
