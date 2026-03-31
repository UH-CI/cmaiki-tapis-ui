import { Files } from '@tapis/tapis-typescript';

interface ParsedSample {
  sampName: string;
  sourceFiles: string[];
}

const FASTQ_EXTENSIONS = ['.fastq.gz', '.fq.gz', '.fastq', '.fq'];

// Index reads to skip: _I1, _I2, _i1, _i2, optionally followed by _<digits>
const INDEX_READ_PATTERN = /_[Ii][12](_\d+)?$/;

// Sequencer-injected suffix tokens stripped from the right:
//   _001, _R1/_R2, _L001, _S1
const SUFFIX_PATTERN = /(_\d+|_[rR][12]|_[lL]\d+|_[sS]\d+)$/;

function stripExtension(filename: string): string | null {
  const lower = filename.toLowerCase();
  for (const ext of FASTQ_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return filename.slice(0, filename.length - ext.length);
    }
  }
  return null;
}

function stripSuffixes(base: string): string {
  let result = base;
  let prev: string;
  do {
    prev = result;
    result = result.replace(SUFFIX_PATTERN, '');
  } while (result !== prev);
  return result;
}

/**
 * Given a list of files, extracts unique sample names by:
 * Filtering to FASTQ files (.fastq.gz, .fq.gz, .fastq, .fq)
 * Skipping I1/I2 index reads
 * Stripping extensions and sequencer-injected suffixes (_S1, _L001, _R1, _001, etc.)
 * Deduplicating (R1 + R2 of the same sample → one entry)
 */
export function parseFileNames(files: Files.FileInfo[]): ParsedSample[] {
  const seen = new Map<string, ParsedSample>();

  for (const file of files) {
    if (file.type !== 'file' || !file.name) continue;

    const base = stripExtension(file.name);
    if (base === null) continue;

    if (INDEX_READ_PATTERN.test(base)) continue;

    const sampName = stripSuffixes(base);
    if (!sampName) continue;

    const key = sampName.toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      existing.sourceFiles.push(file.name);
    } else {
      seen.set(key, { sampName, sourceFiles: [file.name] });
    }
  }

  return Array.from(seen.values());
}
