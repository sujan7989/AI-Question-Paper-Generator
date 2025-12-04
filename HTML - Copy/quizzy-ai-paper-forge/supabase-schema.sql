-- Quizzy AI Paper Forge - Complete Database Schema
-- Run this in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    course_code TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    maximum_marks INTEGER NOT NULL,
    total_units INTEGER NOT NULL
);

-- 2. Create units table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    unit_number INTEGER NOT NULL,
    weightage NUMERIC NOT NULL,
    file_url TEXT,
    extracted_content JSONB
);

-- 3. Create question_papers table (if not exists)
CREATE TABLE IF NOT EXISTS public.question_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    subject_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_marks INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    marks_per_question INTEGER NOT NULL,
    questions_per_section INTEGER NOT NULL,
    generated_questions JSONB NOT NULL,
    paper_config JSONB NOT NULL,
    exam_category TEXT NOT NULL,
    paper_title TEXT NOT NULL
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_units_subject_id ON public.units(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_user_id ON public.question_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_subject_id ON public.question_papers(subject_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;
CREATE POLICY "Users can view their own subjects" 
    ON public.subjects FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subjects" ON public.subjects;
CREATE POLICY "Users can insert their own subjects" 
    ON public.subjects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subjects" ON public.subjects;
CREATE POLICY "Users can update their own subjects" 
    ON public.subjects FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.subjects;
CREATE POLICY "Users can delete their own subjects" 
    ON public.subjects FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Create RLS Policies for units
DROP POLICY IF EXISTS "Users can view units of their subjects" ON public.units;
CREATE POLICY "Users can view units of their subjects" 
    ON public.units FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert units for their subjects" ON public.units;
CREATE POLICY "Users can insert units for their subjects" 
    ON public.units FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update units of their subjects" ON public.units;
CREATE POLICY "Users can update units of their subjects" 
    ON public.units FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete units of their subjects" ON public.units;
CREATE POLICY "Users can delete units of their subjects" 
    ON public.units FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects 
            WHERE subjects.id = units.subject_id 
            AND subjects.user_id = auth.uid()
        )
    );

-- 8. Create RLS Policies for question_papers
DROP POLICY IF EXISTS "Users can view their own question papers" ON public.question_papers;
CREATE POLICY "Users can view their own question papers" 
    ON public.question_papers FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own question papers" ON public.question_papers;
CREATE POLICY "Users can insert their own question papers" 
    ON public.question_papers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own question papers" ON public.question_papers;
CREATE POLICY "Users can update their own question papers" 
    ON public.question_papers FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own question papers" ON public.question_papers;
CREATE POLICY "Users can delete their own question papers" 
    ON public.question_papers FOR DELETE 
    USING (auth.uid() = user_id);

-- 9. Create storage bucket for PDF files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabus-files', 'syllabus-files', false)
ON CONFLICT (id) DO NOTHING;

-- 10. Create storage policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
CREATE POLICY "Users can upload their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'syllabus-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
CREATE POLICY "Users can view their own files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'syllabus-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'syllabus-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'syllabus-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Done! Your database is now ready for PDF-based question generation
SELECT 'Database setup complete!' as message;
