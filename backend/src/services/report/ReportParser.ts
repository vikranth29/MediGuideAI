import pdfParse from 'pdf-parse';

export class ReportParser {
  public static async extractText(
    buffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<string> {
    if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
      try {
        const data = await pdfParse(buffer);
        if (data && data.text && data.text.trim().length > 0) {
          return data.text.trim();
        }
      } catch (pdfErr) {
        console.warn('pdf-parse failed, attempting fallback byte decode:', pdfErr);
      }
    }

    if (
      mimeType.startsWith('text/') ||
      originalName.toLowerCase().endsWith('.txt') ||
      originalName.toLowerCase().endsWith('.csv')
    ) {
      return buffer.toString('utf-8').trim();
    }

    // If image format uploaded to report analyzer
    if (mimeType.startsWith('image/')) {
      return `[Medical Document Image: ${originalName} (size: ${(buffer.length / 1024).toFixed(1)} KB)] - Visual document representation submitted for clinical evaluation.`;
    }

    // Default utf-8 decode with cleanup
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
  }
}
