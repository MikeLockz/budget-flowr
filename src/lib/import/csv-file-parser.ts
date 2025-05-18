import { ParsedCSVData } from './csv-parser';

/**
 * Service for parsing CSV files.
 * This module isolates file I/O operations to make the business logic easier to test.
 */

/**
 * Reads the contents of a file as text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Parses CSV text with Papa Parse and returns the results
 */
export async function parseCSVText(
  text: string, 
  options: { isPreview?: boolean } = {}
): Promise<{ data: ParsedCSVData[]; fields: string[]; errors: import('papaparse').ParseError[] }> {
  const Papa = (await import('papaparse')).default;
  
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedCSVData>(text, {
      header: true,
      preview: options.isPreview ? 10 : undefined,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data,
          fields: results.meta.fields || [],
          errors: results.errors
        });
      },
      error: (error: Error) => reject(error)
    });
  });
}

/**
 * Parses a CSV file and returns headers, sample data, and all data.
 * This function combines the file reading and parsing operations.
 */
export async function parseCSVFile(file: File): Promise<{ 
  headers: string[]; 
  sampleData: ParsedCSVData[]; 
  allData: ParsedCSVData[] 
}> {
  try {
    // Read file content
    const fileContent = await readFileAsText(file);
    
    // Parse for sample and headers
    const sampleResult = await parseCSVText(fileContent, { isPreview: true });
    if (sampleResult.errors.length > 0) {
      throw sampleResult.errors;
    }
    
    // Parse for all data
    const fullResult = await parseCSVText(fileContent);
    if (fullResult.errors.length > 0) {
      throw fullResult.errors;
    }
    
    return {
      headers: sampleResult.fields,
      sampleData: sampleResult.data,
      allData: fullResult.data
    };
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw error;
  }
}