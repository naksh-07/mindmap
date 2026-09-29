'use client';

import React, { useState } from 'react';
import { QuizQuestion } from '@/lib/types/mindmap';
import { X, Award, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapQuizModalProps {
  isOpen: boolean;
  quizQuestions: QuizQuestion[];
  initialNodeId?: string | null;
  onClose: () => void;
}

export const MindMapQuizModal: React.FC<MindMapQuizModalProps> = ({
  isOpen,
  quizQuestions,
  initialNodeId,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Filter questions if initialNodeId is provided
  const questionsToUse = React.useMemo(() => {
    if (initialNodeId) {
      const filtered = quizQuestions.filter((q) => q.nodeId === initialNodeId);
      return filtered.length > 0 ? filtered : quizQuestions;
    }
    return quizQuestions;
  }, [quizQuestions, initialNodeId]);

  if (!isOpen) return null;

  // Empty state fallback when dataset has no quiz questions (BUG-013 Fix)
  if (questionsToUse.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-3xl w-full max-w-sm p-6 relative text-center">
          <button
            onClick={onClose}
            aria-label="Close quiz modal"
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1.5">प्रश्नोत्तरी अनुपलब्ध</h3>
          <p className="text-xs text-muted-foreground mb-5">
            इस मानचित्र के लिए अभी अभ्यास प्रश्न उपलब्ध नहीं हैं।
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-2xl text-xs hover:opacity-90 transition-opacity"
          >
            बंद करें
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questionsToUse[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questionsToUse.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isCompleted ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                प्रश्नोत्तरी (Quiz Mode) • {currentIndex + 1} / {questionsToUse.length}
              </span>
            </div>

            {/* Concept Tag */}
            <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 text-xs font-semibold rounded-full mb-3">
              {currentQ.nodeLabel}
            </span>

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-4 font-sans">
              {currentQ.question}
            </h3>

            {/* Options List */}
            <div className="space-y-2.5 mb-6">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctAnswerIndex;

                let optionClass = 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100';

                if (isAnswered) {
                  if (isCorrect) {
                    optionClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-medium';
                  } else if (isSelected && !isCorrect) {
                    optionClass = 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300 font-medium';
                  } else {
                    optionClass = 'bg-slate-50/40 border-slate-200/40 dark:bg-slate-800/20 dark:border-slate-800 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-2 active:scale-[0.99]',
                      optionClass
                    )}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {isAnswered && (
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl mb-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold block mb-1 text-blue-600 dark:text-blue-400">स्पष्टीकरण (Explanation):</span>
                {currentQ.explanation}
              </div>
            )}

            {/* Next / Finish Button */}
            {isAnswered && (
              <button
                onClick={handleNext}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm shadow-xs transition-all active:scale-[0.98]"
              >
                <span>{currentIndex + 1 < questionsToUse.length ? 'अगला प्रश्न' : 'परिणाम देखें'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Results View */
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">अभ्यास पूर्ण हुआ!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              आपने {questionsToUse.length} में से <span className="font-bold text-blue-600 dark:text-blue-400">{score}</span> प्रश्नों का सही उत्तर दिया।
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पुनः प्रयास करें</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition-all shadow-xs active:scale-95"
              >
                समाप्त
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
