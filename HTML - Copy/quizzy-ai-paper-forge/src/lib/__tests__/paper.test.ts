/**
 * Unit tests for paper.ts utility functions
 * Run with: npx vitest run
 */

import { describe, it, expect } from 'vitest';
import { formatPaperContent, type QuestionPaper } from '../paper';

describe('formatPaperContent', () => {
  it('returns generatedQuestions directly when useKalasalingamFormat is false', () => {
    const result = formatPaperContent({
      subject: 'Test Subject',
      totalMarks: 50,
      generatedQuestions: 'Q1. What is AI? | Remember | CO2',
      useKalasalingamFormat: false,
    });
    expect(result).toBe('Q1. What is AI? | Remember | CO2');
  });

  it('returns HTML when useKalasalingamFormat is true with courseCode', () => {
    const result = formatPaperContent({
      subject: 'Data Structures',
      totalMarks: 50,
      generatedQuestions: 'Q1. Define stack. | Remember | CO2\nQ2. Explain queue. | Understand | CO3',
      courseCode: 'CS101',
      useKalasalingamFormat: true,
    });
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('KALASALINGAM ACADEMY');
    expect(result).toContain('CS101');
    expect(result).toContain('Data Structures');
  });

  it('falls back to generatedQuestions if courseCode is missing', () => {
    const result = formatPaperContent({
      subject: 'Test',
      totalMarks: 50,
      generatedQuestions: 'Q1. Test question | Remember | CO2',
      useKalasalingamFormat: true,
      // no courseCode
    });
    expect(result).toBe('Q1. Test question | Remember | CO2');
  });

  it('includes CO-PO mapping table in generated HTML', () => {
    const result = formatPaperContent({
      subject: 'Networks',
      totalMarks: 100,
      generatedQuestions: 'Q1. Define OSI model. | Remember | CO2',
      courseCode: 'ECE201',
      useKalasalingamFormat: true,
    });
    expect(result).toContain('CO-PO');
  });
});

describe('QuestionPaper type shape', () => {
  it('has required fields', () => {
    const paper: QuestionPaper = {
      id: 1,
      subjectName: 'Test',
      generatedAt: new Date(),
      generatedBy: 'test@test.com',
      config: { totalMarks: 50, totalQuestions: 10, difficulty: 'medium', parts: [] },
      questions: [{ partName: 'Part A', question: 'Q1. Test?', marks: 2 }],
      content: '<html></html>',
    };
    expect(paper.id).toBe(1);
    expect(paper.config.totalMarks).toBe(50);
  });
});
