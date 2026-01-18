import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string | number;
    explanation?: string;
}

interface QuizDisplayProps {
    quizContent: string | { questions: QuizQuestion[] };
    onClose: () => void;
    onFinish?: (results: { 
        score: number; 
        total: number; 
        percentage: number;
        details: Array<{
            question: string;
            isCorrect: number; 
            userAnswer: string;
        }>
    }) => void;
}

type NormalizedOption = { letter: string; text: string };
type NormalizedQuestion = {
    question: string;
    options: NormalizedOption[];
    correctLetter: string;
    explanation?: string;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const QuizDisplay = ({ quizContent, onClose, onFinish }: QuizDisplayProps) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const questions = useMemo((): NormalizedQuestion[] => {
        const toOptions = (arr: any[]): NormalizedOption[] => {
            return arr.map((raw, i) => {
                const rawStr = String(raw);
                const m = rawStr.match(/^\s*([A-Za-z])\)\s*(.*)$/);
                if (m && m[1]) {
                    return { letter: m[1].toUpperCase(), text: (m[2] ?? '').trim() || rawStr.trim() };
                }
                return { letter: LETTERS[i], text: rawStr.trim() };
            });
        };

        const normalizeCorrectLetter = (ca: any, opts: NormalizedOption[]): string => {
            if (ca === undefined || ca === null) return opts[0]?.letter || 'A';
            if (typeof ca === 'number') return opts[ca]?.letter || LETTERS[ca] || 'A';
            
            const s = String(ca).trim().toUpperCase();
            // If the answer is "B) The importance of safety...", extract just the "B"
            const letterMatch = s.match(/^([A-Z])(?:\)|:|\.|\s|$)/);
            if (letterMatch) return letterMatch[1];

            const hit = opts.find(o => o.text.toUpperCase() === s || o.letter === s);
            return hit ? hit.letter : (opts[0]?.letter || 'A');
        };

        let rawQuestions: any[] = [];

        if (typeof quizContent === 'object' && quizContent !== null) {
            rawQuestions = (quizContent as any).questions || (Array.isArray(quizContent) ? quizContent : []);
        } 
        else if (typeof quizContent === 'string') {
            try {
                // 1. STRONGER JSON EXTRACTION: Find the first [ or { and last ] or }
                const startIdx = Math.min(
                    quizContent.indexOf('[') === -1 ? Infinity : quizContent.indexOf('['),
                    quizContent.indexOf('{') === -1 ? Infinity : quizContent.indexOf('{')
                );
                const endIdx = Math.max(quizContent.lastIndexOf(']'), quizContent.lastIndexOf('}'));
                
                if (startIdx !== Infinity && endIdx !== -1) {
                    const jsonString = quizContent.substring(startIdx, endIdx + 1);
                    const parsed = JSON.parse(jsonString);
                    rawQuestions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
                }
            } catch (e) {
                console.error("JSON Parse Error", e);
            }
        }

        return rawQuestions.map((q: any) => {
            const optsText = q.options || q.answerOptions?.map((o: any) => o.text) || [];
            const opts = toOptions(optsText);
            
            // 2. HANDLE 'correct_answer' vs 'correctAnswer'
            const rawCorrect = q.correctAnswer ?? q.correct_answer ?? q.answerOptions?.find((o: any) => o.isCorrect)?.letter;
            
            return {
                question: q.question || "Untitled Question",
                options: opts,
                correctLetter: normalizeCorrectLetter(rawCorrect, opts),
                explanation: q.explanation || q.reasoning,
            };
        });
    }, [quizContent]);

    const handleSelectAnswer = (letter: string) => {
        setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: letter });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    const handleCompleteQuiz = () => {
        const score = questions.reduce((acc, q, idx) => 
            selectedAnswers[idx] === q.correctLetter ? acc + 1 : acc, 0
        );
        const total = questions.length;
        const percentage = Math.round((score / total) * 100);

        const detailedResults = questions.map((q, idx) => ({
            question: q.question,
            isCorrect: selectedAnswers[idx] === q.correctLetter ? 1 : 0,
            userAnswer: selectedAnswers[idx] || '',
        }));

        if (onFinish) {
            onFinish({ score, total, percentage, details: detailedResults });
        }
        onClose();
    };

    if (questions.length === 0) {
        return (
            <Card className="glass-card p-6 border-red-500/50 bg-red-500/5">
                <h3 className="text-xl font-bold mb-2">Formatting Error</h3>
                <p className="text-muted-foreground mb-4 text-sm">The AI response format was unexpected.</p>
                <div className="bg-black/10 p-4 rounded-md text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto mb-4">
                    {JSON.stringify(quizContent, null, 2)}
                </div>
                <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
            </Card>
        );
    }

    if (showResults) {
        const score = questions.reduce((acc, q, idx) => selectedAnswers[idx] === q.correctLetter ? acc + 1 : acc, 0);
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass-card p-6 border-primary/30">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold mb-2">Quiz Results</h3>
                        <div className="text-5xl font-extrabold gradient-text mb-2">{score} / {questions.length}</div>
                    </div>

                    <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2">
                        {questions.map((q, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border ${selectedAnswers[idx] === q.correctLetter ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <p className="font-medium text-sm mb-2">{q.question}</p>
                                <div className="flex items-center gap-2 text-xs">
                                    {selectedAnswers[idx] === q.correctLetter ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                    <span>Answer: {selectedAnswers[idx] || 'None'}</span>
                                    {selectedAnswers[idx] !== q.correctLetter && (
                                        <span className="text-green-600 font-bold ml-auto">Correct: {q.correctLetter}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={() => { setShowResults(false); setCurrentQuestion(0); setSelectedAnswers({}); }} className="flex-1" variant="outline">Retry</Button>
                        <Button onClick={handleCompleteQuiz} className="flex-1 gradient-bg">Save & Finish</Button>
                    </div>
                </Card>
            </motion.div>
        );
    }

    const currentQ = questions[currentQuestion];

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card p-6 border-primary/30 relative">
                <div className="flex items-center justify-between mb-6">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Question {currentQuestion + 1} of {questions.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground italic">One question per video segment</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className="text-lg font-medium mb-6 text-left">
                            <LatexRenderer text={currentQ.question} />
                        </h3>
                        <div className="space-y-3">
                            {currentQ.options.map((opt) => (
                                <button
                                    key={opt.letter}
                                    onClick={() => handleSelectAnswer(opt.letter)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${
                                        selectedAnswers[currentQuestion] === opt.letter
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/30'
                                    }`}
                                >
                                    <span className="font-bold mr-2">{opt.letter})</span>
                                    <LatexRenderer text={opt.text} />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-4 border-t">
                    <Button variant="ghost" onClick={() => setCurrentQuestion(prev => prev - 1)} disabled={currentQuestion === 0}>
                        Back
                    </Button>
                    <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestion]} className="gradient-bg px-8">
                        {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

export default QuizDisplay;