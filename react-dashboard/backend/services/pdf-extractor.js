// PDF Text Extraction Service
// Extracts text content from PDF files using pdf-parse library

let pdfParse;
try {
  pdfParse = require('pdf-parse');
  console.log('✅ PDF-parse library loaded successfully');
} catch (error) {
  console.warn('⚠️ PDF-parse library not available:', error.message);
  console.warn('⚠️ PDF extraction will use fallback mode');
}

class PDFExtractor {
  /**
   * Extract text content from PDF buffer
   * @param {Buffer} pdfBuffer - The PDF file buffer
   * @param {Object} options - Extraction options
   */
  static async extractText(pdfBuffer, options = {}) {
    console.log('📄 PDF Extractor: Starting text extraction');
    console.log('📊 PDF buffer size:', pdfBuffer.length);

    if (!pdfParse) {
      console.warn('⚠️ PDF-parse not available, using fallback extraction');
      return this.extractTextFallback(pdfBuffer);
    }

    try {
      console.log('🔍 Parsing PDF with pdf-parse...');
      
      const data = await pdfParse(pdfBuffer, {
        // Options for better text extraction
        max: options.maxPages || 50, // Maximum pages to process
        version: 'v1.10.100' // Specific version for stability
      });

      console.log('✅ PDF parsing successful');
      console.log('📊 PDF stats:', {
        pages: data.numpages,
        textLength: data.text.length,
        info: data.info?.Title || 'No title'
      });

      // Clean and structure the extracted text
      const cleanText = this.cleanExtractedText(data.text);
      
      return {
        success: true,
        text: cleanText,
        metadata: {
          pages: data.numpages,
          title: data.info?.Title || '',
          author: data.info?.Author || '',
          subject: data.info?.Subject || '',
          creator: data.info?.Creator || '',
          producer: data.info?.Producer || '',
          creationDate: data.info?.CreationDate || null,
          modificationDate: data.info?.ModDate || null,
          extractedAt: new Date().toISOString(),
          originalLength: data.text.length,
          cleanedLength: cleanText.length
        }
      };

    } catch (error) {
      console.error('❌ PDF parsing failed:', error.message);
      
      // Try fallback extraction
      return this.extractTextFallback(pdfBuffer);
    }
  }

  /**
   * Clean extracted text by removing extra whitespace and formatting issues
   */
  static cleanExtractedText(rawText) {
    if (!rawText) return '';

    console.log('🧹 Cleaning extracted text...');

    let cleanText = rawText
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page breaks and form feeds
      .replace(/[\f\r]/g, '')
      // Fix line breaks - keep paragraph breaks but remove single line breaks
      .replace(/\n\s*\n/g, '\n\n') // Keep double line breaks (paragraphs)
      .replace(/(?<!\n)\n(?!\n)/g, ' ') // Replace single line breaks with spaces
      // Remove repeated spaces
      .replace(/ +/g, ' ')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      // Final cleanup
      .trim();

    console.log('✅ Text cleaning completed');
    console.log('📊 Cleaning stats:', {
      originalLength: rawText.length,
      cleanedLength: cleanText.length,
      reductionPercent: Math.round((1 - cleanText.length / rawText.length) * 100)
    });

    return cleanText;
  }

  /**
   * Fallback extraction when pdf-parse is not available
   */
  static extractTextFallback(pdfBuffer) {
    console.log('📝 Using fallback PDF text extraction');

    // Simple fallback - try to extract basic text patterns
    const bufferString = pdfBuffer.toString('latin1');
    
    // Look for text patterns in PDF
    const textMatches = bufferString.match(/\(([^)]+)\)/g);
    let extractedText = '';

    if (textMatches) {
      extractedText = textMatches
        .map(match => match.slice(1, -1)) // Remove parentheses
        .filter(text => text.length > 2) // Filter out short matches
        .join(' ')
        .replace(/[^\w\s\.\,\!\?\-]/g, ' ') // Clean special characters
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (extractedText.length < 50) {
      extractedText = 'PDF content could not be extracted automatically. Please convert to text format or use OCR.';
    }

    return {
      success: false,
      text: extractedText,
      metadata: {
        pages: 'unknown',
        title: '',
        author: '',
        extractedAt: new Date().toISOString(),
        extractionMethod: 'fallback',
        originalLength: pdfBuffer.length,
        cleanedLength: extractedText.length
      },
      warning: 'PDF extraction used fallback method. Results may be incomplete.'
    };
  }

  /**
   * Extract text and split into sections/chapters
   */
  static async extractStructuredText(pdfBuffer, options = {}) {
    const extraction = await this.extractText(pdfBuffer, options);
    
    if (!extraction.success || extraction.text.length < 100) {
      return extraction;
    }

    console.log('📚 Structuring extracted text into sections...');

    // Try to identify sections/chapters
    const sections = this.identifySections(extraction.text);

    return {
      ...extraction,
      sections: sections,
      structured: true
    };
  }

  /**
   * Identify sections/chapters in the text
   */
  static identifySections(text) {
    const sections = [];
    
    // Look for common section patterns
    const sectionPatterns = [
      /^(Chapter|Kapitola|Část)\s+\d+/gmi,
      /^(Section|Sekce|Oddíl)\s+\d+/gmi,
      /^\d+\.\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/gm,
      /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][^.!?]*$/gm
    ];

    let currentSection = null;
    let currentContent = '';
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      let isSection = false;
      
      // Check if line matches section patterns
      for (const pattern of sectionPatterns) {
        if (pattern.test(line)) {
          // Save previous section
          if (currentSection) {
            sections.push({
              title: currentSection,
              content: currentContent.trim()
            });
          }
          
          // Start new section
          currentSection = line.trim();
          currentContent = '';
          isSection = true;
          break;
        }
      }
      
      if (!isSection) {
        currentContent += line + '\n';
      }
    }
    
    // Add last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.trim()
      });
    }

    // If no sections found, create one big section
    if (sections.length === 0) {
      sections.push({
        title: 'Content',
        content: text
      });
    }

    console.log('📊 Identified', sections.length, 'sections');
    
    return sections;
  }

  /**
   * Validate PDF file buffer
   */
  static validatePDF(buffer) {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Empty buffer' };
    }

    // Check PDF signature
    const pdfSignature = buffer.slice(0, 4).toString();
    if (pdfSignature !== '%PDF') {
      return { valid: false, error: 'Invalid PDF signature' };
    }

    // Check minimum size (basic PDF should be at least 1KB)
    if (buffer.length < 1024) {
      return { valid: false, error: 'PDF file too small' };
    }

    return { valid: true };
  }
}

module.exports = { PDFExtractor }; 