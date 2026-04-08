// Subject management utilities
import { supabase } from '@/integrations/supabase/client';
import { extractPDFContent, type PDFContent } from './pdf-processor';
import { extractRealPDFContent } from './pdf-extractor-real';

export interface SubjectUnit {
  id: string;
  unit_name: string;
  unit_number: number;
  weightage: number;
  file_url?: string;
  extracted_content?: PDFContent;
}

export interface Subject {
  id: string;
  subject_name: string;
  course_code: string;
  exam_type: string;
  maximum_marks: number;
  total_units: number;
  user_id: string;
  created_at: string;
  units?: SubjectUnit[];
}

export interface SubjectFormData {
  subjectName: string;
  courseCode: string;
  examType: string;
  maxMarks: number;
  numUnits: number;
  units: Array<{
    name: string;
    weightage: number;
    pdfFile?: File;
  }>;
}

/**
 * Creates a new subject with units and processes PDF files
 */
export async function createSubjectWithUnits(
  formData: SubjectFormData,
  userId: string,
  onProgress?: (progress: number, message: string) => void
): Promise<Subject> {
  try {
    onProgress?.(10, 'Creating subject...');
    
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .insert({
        user_id: userId,
        subject_name: formData.subjectName.trim(),
        course_code: formData.courseCode.trim().toUpperCase(),
        maximum_marks: formData.maxMarks,
        exam_type: formData.examType,
        total_units: formData.numUnits
      })
      .select()
      .single();

    if (subjectError) throw subjectError;

    onProgress?.(20, 'Subject created, processing units...');

    const units: SubjectUnit[] = [];

    for (let i = 0; i < formData.units.length; i++) {
      const unit = formData.units[i];
      const progress = 20 + ((i / formData.units.length) * 70);
      
      onProgress?.(progress, `Processing Unit ${i + 1}: ${unit.name}...`);

      let fileUrl: string | undefined;
      let extractedContent: PDFContent | undefined;

      if (unit.pdfFile) {
        try {
          const fileExt = unit.pdfFile.name.split('.').pop();
          const fileName = `${userId}/${subjectData.id}/unit-${i + 1}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('syllabus-files')
            .upload(fileName, unit.pdfFile);

          if (uploadError) throw uploadError;
          fileUrl = uploadData.path;

          onProgress?.(progress + 5, `Extracting content from Unit ${i + 1} PDF...`);

          // Try real extraction first
          const realExtraction = await extractRealPDFContent(unit.pdfFile);

          if (realExtraction.success && realExtraction.text.length > 100) {
            extractedContent = {
              text: realExtraction.text,
              numPages: realExtraction.numPages,
              title: unit.name,
              subject: unit.name
            };
          } else {
            // Fallback to pdf-processor (same real extraction, different entry point)
            const fallback = await extractPDFContent(unit.pdfFile);
            extractedContent = fallback;
          }

        } catch (error: any) {
          // Clean up uploaded file and subject on failure
          if (fileUrl) await supabase.storage.from('syllabus-files').remove([fileUrl]).catch(() => {});
          await supabase.from('subjects').delete().eq('id', subjectData.id).catch(() => {});
          throw new Error(
            error?.message ||
            `Failed to extract content from Unit ${i + 1} PDF. Please upload a text-based PDF.`
          );
        }
      }

      const { data: unitData, error: unitError} = await supabase
        .from('units')
        .insert({
          subject_id: subjectData.id,
          unit_name: unit.name,
          unit_number: i + 1,
          weightage: unit.weightage,
          file_url: fileUrl,
          extracted_content: extractedContent
        })
        .select()
        .single();
      
      if (unitError) {
        throw unitError;
      }

      units.push({
        ...unitData,
        extracted_content: extractedContent
      });
    }

    onProgress?.(100, 'Subject created successfully!');

    return {
      ...subjectData,
      units
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Gets all subjects for a user with their units
 */
export async function getUserSubjects(userId: string): Promise<Subject[]> {
  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select(`
        *,
        units (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subjectsError) throw subjectsError;

    return subjects || [];

  } catch (error) {
    return [];
  }
}

/**
 * Gets PDF files for selected units to send directly to AI
 */
export async function getPDFFilesForUnits(
  subject: Subject,
  selectedUnits: string[]
): Promise<Array<{ unitName: string; file: File; weightage: number }>> {
  const pdfFiles: Array<{ unitName: string; file: File; weightage: number }> = [];
  
  if (!subject.units) return pdfFiles;
  
  const relevantUnits = subject.units.filter(unit => selectedUnits.includes(unit.id));
  
  for (const unit of relevantUnits) {
    if (unit.file_url) {
      try {
        // Download PDF from Supabase
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('syllabus-files')
          .download(unit.file_url);
        
        if (downloadError) throw downloadError;
        
        if (fileData) {
          const pdfFile = new File([fileData], `${unit.unit_name}.pdf`, { type: 'application/pdf' });
          pdfFiles.push({
            unitName: unit.unit_name,
            file: pdfFile,
            weightage: unit.weightage
          });
        }
      } catch (error) {
        // Failed to retrieve PDF for unit
      }
    }
  }
  
  return pdfFiles;
}

/**
 * Extracts PDF content for all selected units — returns the cleaned text.
 * Used by QuestionPaperConfig to generate per-part prompts.
 */
export async function extractContentForUnits(
  subject: Subject,
  selectedUnits: string[],
  unitWeightages: Record<string, number>
): Promise<string> {
  if (!subject.units) throw new Error('Subject has no units');
  const relevantUnits = subject.units.filter(unit => selectedUnits.includes(unit.id));
  if (relevantUnits.length === 0) throw new Error('No units selected');

  // 5000 chars per unit — enough for real questions
  const perUnitBudget = Math.min(5000, Math.floor(15000 / relevantUnits.length));
  let contentSections = '';

  for (const unit of relevantUnits) {
    const weightage = unitWeightages[unit.id] || 0;
    contentSections += `\n\n=== ${unit.unit_name} (${weightage}%) ===\n`;
    let actualContent = '';

    if (!unit.extracted_content?.text || unit.extracted_content.text.length < 100) {
      if (unit.file_url) {
        try {
          const { data: fileData, error } = await supabase.storage.from('syllabus-files').download(unit.file_url);
          if (error) throw new Error(`Could not download PDF for "${unit.unit_name}".`);
          const pdfFile = new File([fileData], unit.unit_name + '.pdf', { type: 'application/pdf' });
          const { extractRealPDFContent } = await import('./pdf-extractor-real');
          const extraction = await extractRealPDFContent(pdfFile);
          if (!extraction.success || extraction.text.length < 100) {
            throw new Error(extraction.error || `Could not extract text from "${unit.unit_name}". Please re-upload a text-based PDF.`);
          }
          actualContent = extraction.text;
          await supabase.from('units').update({ extracted_content: { text: extraction.text, numPages: extraction.numPages } }).eq('id', unit.id);
        } catch (e: any) {
          throw new Error(e?.message || `Failed to load content for "${unit.unit_name}".`);
        }
      } else {
        throw new Error(`No PDF uploaded for "${unit.unit_name}". Please go back and upload a PDF.`);
      }
    } else {
      actualContent = unit.extracted_content.text;
    }

    const cleaned = cleanPDFText(actualContent);
    contentSections += cleaned.length > perUnitBudget ? cleaned.substring(0, perUnitBudget) : cleaned;
  }
  return contentSections;
}

/**
 * Builds a focused prompt for a single part — small enough to complete within Vercel timeout.
 */
export function buildPartPrompt(
  subjectName: string,
  contentSections: string,
  part: { name: string; questions: number; marks: number; difficulty: 'easy' | 'medium' | 'hard'; choicesEnabled: boolean; scenarioQuestions?: number },
  startQNum: number
): string {
  const count = part.choicesEnabled ? Math.ceil(part.questions * 1.5) : part.questions;
  const endQNum = startQNum + count - 1;

  const diffStyle = part.difficulty === 'easy'
    ? 'EASY — simple and straightforward. Mix of: simple calculations, basic definitions, short theory, simple diagrams. Keep questions simple.'
    : part.difficulty === 'medium'
    ? 'MEDIUM — moderate complexity. Mix of: multi-step calculations, detailed explanations, comparisons, process descriptions, moderate diagrams.'
    : 'HARD — high complexity. Mix of: complex calculations with derivations, deep analysis, design problems, comprehensive theory, detailed diagrams.';

  const scenarioNote = (part.scenarioQuestions ?? 0) > 0
    ? `\nSCENARIO: ${part.scenarioQuestions} questions must start with a 2-3 sentence real-world context, then ask a question from it. Format: Q[n]. [Scenario: context] Question | Bloom | CO[2-4]`
    : '';

  return `Generate EXACTLY ${count} exam questions (Q${startQNum} to Q${endQNum}) from the PDF content below.
${diffStyle}${scenarioNote}

RULES:
- Use ONLY specific terms, formulas, algorithms, examples from the PDF
- Do NOT use general knowledge or add examples not in the PDF
- Do NOT mention the subject name in questions
- Format: Q${startQNum}. question | Bloom | CO2 (CO must be CO2, CO3, or CO4)

=== PDF CONTENT ===
${contentSections.substring(0, 6000)}
=== END ===

Generate Q${startQNum} to Q${endQNum} now:`;
}

/**
 * Builds ONE combined prompt for all parts — single API call, no rate limiting.
 * Content is capped at 3000 chars so total prompt stays under Groq's TPM limit.
 */
export function buildCombinedPrompt(
  subjectName: string,
  contentSections: string,
  parts: Array<{ name: string; questions: number; marks: number; difficulty: 'easy' | 'medium' | 'hard'; choicesEnabled: boolean; scenarioQuestions?: number }>
): string {
  const totalQ = parts.reduce((s, p) => s + (p.choicesEnabled ? Math.ceil(p.questions * 1.5) : p.questions), 0);

  let qNum = 1;
  const partLines = parts.map(p => {
    const count = p.choicesEnabled ? Math.ceil(p.questions * 1.5) : p.questions;
    const end = qNum + count - 1;
    const style = p.difficulty === 'easy'
      ? 'EASY: simple recall, basic definitions, straightforward questions'
      : p.difficulty === 'medium'
      ? 'MEDIUM: explanations, comparisons, process descriptions, moderate calculations'
      : 'HARD: complex analysis, derivations, multi-step calculations, design problems';
    const scenario = (p.scenarioQuestions ?? 0) > 0
      ? ` [${p.scenarioQuestions} must be scenario-based: write 2-sentence context then ask question]`
      : '';
    const line = `${p.name}: Q${qNum}–Q${end} | ${style}${scenario}`;
    qNum += count;
    return line;
  }).join('\n');

  // Cap content at 2000 chars — leaves enough tokens for 25 questions output
  const content = contentSections.substring(0, 2000);

  return `Generate EXACTLY ${totalQ} exam questions from the PDF content below.

PARTS:
${partLines}

=== PDF CONTENT ===
${content}
=== END ===

STRICT FORMAT — every line must look exactly like this:
Q1. What is Gini Index? | Remember | CO2
Q2. Explain how decision trees handle overfitting. | Understand | CO3
Q3. Calculate the entropy for a node with 5 positive and 3 negative examples. | Apply | CO4

RULES:
- Use ONLY terms, formulas, algorithms from the PDF above
- Do NOT use general knowledge
- Do NOT mention the subject name in questions
- Bloom must be one of: Remember, Understand, Apply, Analyze, Evaluate, Create
- CO must be exactly CO2, CO3, or CO4

Generate Q1 to Q${totalQ}:`;
}

/**
 * Legacy function — kept for compatibility
 */
export async function generatePromptFromSubjectUnits(
  subject: Subject,
  selectedUnits: string[],
  unitWeightages: Record<string, number>,
  questionConfig: {
    totalQuestions: number;
    totalMarks: number;
    difficulty: string;
    parts: Array<{ name: string; questions: number; marks: number; difficulty: 'easy' | 'medium' | 'hard'; choicesEnabled: boolean; scenarioQuestions?: number }>;
  }
): Promise<string> {
  const contentSections = await extractContentForUnits(subject, selectedUnits, unitWeightages);
  // Return first part prompt for backward compatibility
  if (questionConfig.parts.length > 0) {
    return buildPartPrompt(subject.subject_name, contentSections, questionConfig.parts[0], 1);
  }
  return contentSections;
}

/**
 * Smart full-document content extractor.
 *
 * Strategy:
 * 1. Split the full PDF text into "sections" by detecting headings
 * 2. Score every section based on how much important content it has
 * 3. Pick the highest-scoring sections from ANYWHERE in the document
 * 4. Within each selected section, keep the most informative sentences
 * 5. Reassemble in original document order so context is preserved
 *
 * This ensures important topics from page 1, page 10, or page 20 are all captured.
 */
function extractImportantContent(fullText: string, budget: number): string {
  // Step 1: Clean noise first
  const lines = fullText
    .split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (l.length < 4) return false;
      if (/^[\d\s\.\-\|]+$/.test(l)) return false;           // pure numbers/separators
      if (/^(page\s*\d|figure\s*\d|fig\.\s*\d|table\s*\d)/i.test(l)) return false;
      if (/^(www\.|http|©|®|™|isbn|doi:)/i.test(l)) return false;
      if (/^references?$|^bibliography$/i.test(l)) return false;
      return true;
    });

  if (lines.length === 0) return fullText.substring(0, budget);

  // Step 2: Group lines into sections by detecting headings
  const sections: Array<{ heading: string; lines: string[]; startIdx: number }> = [];
  let currentSection: { heading: string; lines: string[]; startIdx: number } = {
    heading: 'Introduction',
    lines: [],
    startIdx: 0,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isHeading(line)) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { heading: line, lines: [], startIdx: i };
    } else {
      currentSection.lines.push(line);
    }
  }
  if (currentSection.lines.length > 0) sections.push(currentSection);

  // If no sections detected, treat whole document as one section
  if (sections.length === 0) {
    return lines.join('\n').substring(0, budget);
  }

  // Step 3: Score each section
  const scored = sections.map(section => ({
    ...section,
    score: scoreSection(section.heading, section.lines),
  }));

  // Step 4: Sort by score to find most important sections
  const sortedByScore = [...scored].sort((a, b) => b.score - a.score);

  // Step 5: Pick top sections until budget is filled,
  // but track original indices to reassemble in document order
  const selectedIndices = new Set<number>();
  let usedBudget = 0;

  for (const section of sortedByScore) {
    const sectionText = section.heading + '\n' + section.lines.join('\n');
    const sectionSize = sectionText.length;

    if (usedBudget + sectionSize <= budget) {
      selectedIndices.add(section.startIdx);
      usedBudget += sectionSize;
    } else if (usedBudget < budget * 0.5) {
      // If we haven't filled even half the budget, take a trimmed version
      selectedIndices.add(section.startIdx);
      usedBudget = budget; // stop after this
      break;
    }

    if (usedBudget >= budget) break;
  }

  // Step 6: Reassemble in original document order
  const result = scored
    .filter(s => selectedIndices.has(s.startIdx))
    .sort((a, b) => a.startIdx - b.startIdx)
    .map(s => {
      const sectionText = s.heading + '\n' + s.lines.join('\n');
      // Within each section, keep the most informative sentences
      return trimSectionToImportant(s.heading, s.lines, Math.floor(budget / Math.max(selectedIndices.size, 1)));
    })
    .join('\n\n');

  return result.length > 0 ? result : lines.join('\n').substring(0, budget);
}

/** Detect if a line is a heading/subheading */
function isHeading(line: string): boolean {
  if (line.length < 3 || line.length > 120) return false;
  // ALL CAPS heading
  if (/^[A-Z][A-Z\s\d\-:]{4,}$/.test(line)) return true;
  // Numbered heading: "1.", "1.1", "1.1.1", "Chapter 1", "Unit 1", "Section 1"
  if (/^(\d+\.)+\s+\S/.test(line)) return true;
  if (/^(chapter|unit|section|topic|module|part)\s+\d+/i.test(line)) return true;
  // Short title-case line (likely a heading)
  if (line.length < 60 && /^[A-Z][a-zA-Z\s\-:]+$/.test(line) && line.split(' ').length <= 8) return true;
  return false;
}

/** Score a section based on how much important content it contains */
function scoreSection(heading: string, lines: string[]): number {
  let score = 0;
  const text = lines.join(' ').toLowerCase();

  // Heading importance
  if (/^(chapter|unit|section|topic|module)/i.test(heading)) score += 10;
  if (/\d+\.\d+/.test(heading)) score += 5; // numbered subheading

  // Content richness signals
  const definitionCount = (text.match(/\b(is defined as|refers to|is called|means|definition of|denoted by|known as)\b/g) || []).length;
  score += definitionCount * 8;

  const formulaCount = (text.match(/\b(formula|equation|calculate|compute|algorithm|steps?|procedure)\b/g) || []).length;
  score += formulaCount * 6;

  const exampleCount = (text.match(/\b(example|for instance|such as|e\.g\.|i\.e\.|consider|suppose|given)\b/g) || []).length;
  score += exampleCount * 4;

  const technicalCount = (text.match(/\b(algorithm|model|method|technique|approach|process|system|network|function|matrix|vector|probability|entropy|gradient|accuracy|precision|recall|classification|regression|clustering|optimization)\b/g) || []).length;
  score += technicalCount * 3;

  // Numbered/bulleted lists are usually key points
  const listCount = lines.filter(l => /^[\d\-\*•]\s/.test(l)).length;
  score += listCount * 2;

  // Longer sections have more content
  score += Math.min(lines.length, 20);

  return score;
}

/** Within a section, keep the most informative sentences up to the budget */
function trimSectionToImportant(heading: string, lines: string[], budget: number): string {
  // Score each line
  const scoredLines = lines.map(line => {
    let s = 0;
    const l = line.toLowerCase();
    if (/\b(is defined as|refers to|is called|means|definition)\b/.test(l)) s += 10;
    if (/\b(formula|equation|algorithm|steps?|procedure|calculate)\b/.test(l)) s += 8;
    if (/\b(example|for instance|such as|e\.g\.|consider)\b/.test(l)) s += 6;
    if (/\b(important|key|main|primary|fundamental|essential|critical)\b/.test(l)) s += 5;
    if (/^[\d\-\*•]\s/.test(line)) s += 4;  // list item
    if (line.length > 50 && line.length < 300) s += 2;
    if (line.length < 15) s -= 3;
    return { line, score: s };
  });

  // Sort by score but keep track of original order
  const withIndex = scoredLines.map((item, idx) => ({ ...item, idx }));
  withIndex.sort((a, b) => b.score - a.score);

  // Pick top lines within budget, then re-sort by original index
  const selected: number[] = [];
  let used = heading.length + 1;
  for (const item of withIndex) {
    if (used + item.line.length + 1 > budget) break;
    selected.push(item.idx);
    used += item.line.length + 1;
  }
  selected.sort((a, b) => a - b);

  const body = selected.length > 0
    ? selected.map(i => lines[i]).join('\n')
    : lines.slice(0, Math.floor(budget / 80)).join('\n'); // fallback: first N lines

  return `${heading}\n${body}`;
}

/**
 * Clean raw PDF text — remove noise while preserving reading order.
 */
function cleanPDFText(text: string): string {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (l.length < 3) return false;
      if (/^[\d\s\.\-]+$/.test(l)) return false;
      if (/^(page|pg|figure|fig|table|ref|www\.|http)/i.test(l)) return false;
      if (/^\s*[©®™]\s/.test(l)) return false;
      return true;
    })
    .join('\n');
}


