import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
}

interface QuizDisplayProps {
  quizContent: string | { questions: QuizQuestion[] };
  onClose: () => void;
}

const QuizDisplay = ({ quizContent, onClose }: QuizDisplayProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Parse quiz content
  const parseQuiz = (): QuizQuestion[] => {
    if (typeof quizContent === 'object' && quizContent.questions) {
      return quizContent.questions;
    }

    const questions: QuizQuestion[] = [];
    const content = typeof quizContent === 'string' ? quizContent : JSON.stringify(quizContent);
    
    console.log('🔍 Parsing quiz content:', content.substring(0, 200));
    console.log('🔍 Full content:', content);
    
    // Try multiple split patterns
    let questionBlocks = content.split(/\n\n\d+\.\s*\*\*Question\s+\d+:\*\*/i);
    
    // If that didn't work, try without the leading newlines
    if (questionBlocks.length <= 1) {
      questionBlocks = content.split(/\d+\.\s*\*\*Question\s+\d+:\*\*/i);
    }
    
    console.log('📦 Question blocks found:', questionBlocks.length);
    
    questionBlocks.forEach((block, idx) => {
      if (!block.trim() || idx === 0) return; // Skip empty blocks and preamble
      
      console.log(`📝 Processing block ${idx}:`, block.substring(0, 150));
      
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      console.log(`📋 Lines in block ${idx}:`, lines);
      
      if (lines.length < 2) {
        console.warn(`⚠️ Block ${idx} has too few lines:`, lines.length);
        return;
      }

      // First non-empty line is the question
      const questionText = lines[0].trim();
      const options: string[] = [];
      let correctAnswer = '';

      // Process remaining lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Match options like "A) ...", "B) ...", etc.
        if (/^[A-D]\)\s+/.test(line)) {
          options.push(line);
          console.log(`  ✓ Found option: ${line.substring(0, 30)}...`);
        }
        
        // Match answer like "**Answer:** C) ..." (with or without space before letter)
        if (/\*\*Answer:\*\*/i.test(line)) {
          // Try to extract the letter (A, B, C, or D)
          const answerMatch = line.match(/\*\*Answer:\*\*\s*([A-D])\)/i);
          if (answerMatch) {
            correctAnswer = answerMatch[1];
            console.log(`  ✓ Found answer: ${correctAnswer}`);
          } else {
            console.warn(`  ⚠️ Answer line found but couldn't extract letter:`, line);
          }
        }
      }

      if (questionText && options.length > 0 && correctAnswer) {
        questions.push({
          question: questionText,
          options,
          correctAnswer,
        });
        console.log(`✅ Parsed question ${questions.length}:`, {
          question: questionText.substring(0, 50),
          optionCount: options.length,
          correctAnswer
        });
      } else {
        console.warn(`⚠️ Incomplete question data for block ${idx}:`, {
          hasQuestion: !!questionText,
          question: questionText?.substring(0, 50),
          optionCount: options.length,
          hasAnswer: !!correctAnswer,
          allLines: lines
        });
      }
    });

    console.log(`📊 Total questions parsed: ${questions.length}`);
    console.log(`📊 Parsed questions:`, questions);
    
    return questions;
  };

  const questions = parseQuiz();

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const userAnswer = selectedAnswers[idx];
      // Extract just the letter from the user's answer (e.g., "A) ..." -> "A")
      const userLetter = userAnswer?.match(/^([A-D])\)/)?.[1];
      if (userLetter === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (questions.length === 0) {
    return (
      <Card className="glass-card p-6 border-primary/30">
        <p className="text-muted-foreground mb-4">
          Unable to parse quiz questions. Here's the raw content:
        </p>
        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
          {typeof quizContent === 'string' ? quizContent : JSON.stringify(quizContent, null, 2)}
        </pre>
        <Button variant="ghost" className="mt-4" onClick={onClose}>
          Close
        </Button>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="glass-card p-6 border-primary/30">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
            <div className="text-4xl font-bold gradient-text mb-2">
              {score} / {questions.length}
            </div>
            <p className="text-muted-foreground">
              You scored {percentage}%
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {questions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const userLetter = userAnswer?.match(/^([A-D])\)/)?.[1];
              const isCorrect = userLetter === q.correctAnswer;

              return (
                <div key={idx} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{q.question}</p>
                      <p className="text-sm text-muted-foreground">
                        Your answer: {userAnswer || 'No answer'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Correct answer: {q.options.find(opt => opt.startsWith(q.correctAnswer + ')'))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRestart} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="glass-card p-6 border-primary/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Quiz</h3>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg font-medium mb-4">{currentQ.question}</p>

            <div className="space-y-2 mb-6">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentQuestion
                    ? 'bg-primary'
                    : selectedAnswers[idx]
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion]}
            className="gradient-bg"
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <Button variant="ghost" className="w-full mt-4" onClick={onClose}>
          Cancel Quiz
        </Button>
      </Card>
    </motion.div>
  );
};

export default QuizDisplay;
