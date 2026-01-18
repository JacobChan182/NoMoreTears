import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer.tsx';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string; // Stored as 'A', 'B', 'C', or 'D'
    explanation?: string;
}

// Updated interface to include the "details" array
interface QuizDisplayProps {
    quizContent: string | { questions: any[] };
    onClose: () => void;
    onFinish?: (results: { 
        score: number; 
        total: number; 
        percentage: number;
        details: Array<{
            question: string;
            isCorrect: boolean;
            userAnswer: string;
        }>
    }) => void;
}

const QuizDisplay = ({ quizContent, onClose, onFinish }: QuizDisplayProps) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const questions = useMemo((): QuizQuestion[] => {
        if (typeof quizContent === 'object' && quizContent.questions) {
            return quizContent.questions.map(q => ({
                question: q.question,
                options: q.options || q.answerOptions?.map((o: any) => o.text) || [],
                correctAnswer: String(q.correctAnswer || q.answerOptions?.find((o: any) => o.isCorrect)?.letter || 'A').toUpperCase(),
                explanation: q.explanation
            }));
        }

        const content = String(quizContent);
        const questionList: QuizQuestion[] = [];
        let blocks = content.split(/(?=###?\s*Question\s*\d+)|(?=\*\*Question\s*\d+[:)]?\*\*)/i);

        if (blocks.length <= 1) {
            blocks = content.split(/(?=^\s*\d+\.\s*\*\*.+\*\*)/m);
        }

        blocks.forEach((block) => {
            const trimmedBlock = block.trim();
            if (!trimmedBlock || trimmedBlock.length < 20) return;

            const lines = trimmedBlock.split('\n').map(l => l.trim()).filter(Boolean);
            let questionText = "";
            const options: string[] = [];
            let correctAnswer = "";
            let parsingOptions = false;

            lines.forEach(line => {
                if (/^(###?\s*)?Question\s*\d+/i.test(line)) return;
                if (/^\d+\.\s*\*\*.+\*\*/.test(line)) {
                    questionText += (questionText ? " " : "") + line.replace(/^\d+\.\s*\*\*|\*\*$/g, "");
                    return;
                }

                const optionMatch = line.match(/^[-*]?\s*([A-Da-d])\)\s*(.*)/);
                const answerMatch = line.match(/(?:\*\*)?Answer:(?:\*\*)?\s*([A-Da-d])/i);

                if (optionMatch) {
                    parsingOptions = true;
                    options.push(line.replace(/^[-*]\s*/, ""));
                } else if (answerMatch) {
                    correctAnswer = answerMatch[1].toUpperCase();
                } else if (!parsingOptions && !line.startsWith('---')) {
                    questionText += (questionText ? " " : "") + line.replace(/^\*\*|\*\*$/g, "");
                }
            });

            if (questionText && options.length > 0) {
                questionList.push({
                    question: questionText,
                    options,
                    correctAnswer: correctAnswer || options[0].charAt(0).toUpperCase()
                });
            }
        });

        return questionList;
    }, [quizContent]);

    const handleSelectAnswer = (option: string) => {
        setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: option });
    };

    const calculateScore = () => {
        return questions.reduce((score, q, idx) => {
            const userSelection = selectedAnswers[idx];
            const userLetter = userSelection?.trim().charAt(0).toUpperCase();
            return userLetter === q.correctAnswer ? score + 1 : score;
        }, 0);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestion(0);
        setSelectedAnswers({});
        setShowResults(false);
    };

    // Modified to create the detailed list of questions/correctness
    const handleCompleteQuiz = () => {
        const score = calculateScore();
        const total = questions.length;
        const percentage = Math.round((score / total) * 100);
    
        // Create a detailed breakdown with 1 for correct and 0 for incorrect
        const detailedResults = questions.map((q, idx) => {
            const userSelection = selectedAnswers[idx];
            const userLetter = userSelection?.trim().charAt(0).toUpperCase();
            
            // Convert boolean to 1 or 0
            const isCorrectBinary = userLetter === q.correctAnswer ? 1 : 0;
    
            return {
                question: q.question,
                isCorrect: isCorrectBinary, // Now stores 1 or 0
                userAnswer: userSelection
            };
        });
    
        if (onFinish) {
            onFinish({
                score,
                total,
                percentage,
                details: detailedResults
            });
        }
        onClose();
    };

    if (questions.length === 0) {
        return (
            <Card className="glass-card p-6 border-red-500/50 bg-red-500/5">
                <h3 className="text-xl font-bold mb-2">Quiz Parsing Error</h3>
                <p className="text-muted-foreground mb-4 text-sm">We couldn't automatically format the quiz.</p>
                <div className="bg-black/10 p-4 rounded-md text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto mb-4">
                    {String(quizContent)}
                </div>
                <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
            </Card>
        );
    }

    if (showResults) {
        const score = calculateScore();
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass-card p-6 border-primary/30">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold mb-2">Quiz Results</h3>
                        <div className="text-5xl font-extrabold gradient-text mb-2">{score} / {questions.length}</div>
                        <p className="text-muted-foreground">Accuracy: {percentage}%</p>
                    </div>

                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 text-left">
                        {questions.map((q, idx) => {
                            const userSelection = selectedAnswers[idx];
                            const userLetter = userSelection?.trim().charAt(0).toUpperCase();
                            const isCorrect = userLetter === q.correctAnswer;

                            return (
                                <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <p className="font-medium text-sm mb-2">{q.question}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        {isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        <span>Your answer: {userSelection}</span>
                                    </div>
                                    {!isCorrect && (
                                        <p className="text-xs text-green-600 mt-1 font-semibold">
                                            Correct: {q.options.find(o => o.startsWith(q.correctAnswer))}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleRestart} className="flex-1" variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Retry</Button>
                        <Button onClick={handleCompleteQuiz} className="flex-1 gradient-bg">Finish</Button>
                    </div>
                </Card>
            </motion.div>
        );
    }

    const currentQ = questions[currentQuestion];
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card p-6 border-primary/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">Question {currentQuestion + 1} of {questions.length}</Badge>
                    <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="min-h-[200px]"
                    >
                        <h3 className="text-lg font-medium mb-6 text-left">
                            <LatexRenderer text={currentQ.question} />
                        </h3>
                        <div className="space-y-3">
                            {currentQ.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectAnswer(option)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm ${selectedAnswers[currentQuestion] === option
                                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                        }`}
                                >
                                    <LatexRenderer text={option} />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentQuestion(prev => prev - 1)}
                        disabled={currentQuestion === 0}
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestion]}
                        className="px-8 gradient-bg"
                    >
                        {currentQuestion === questions.length - 1 ? 'See Results' : 'Next'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

export default QuizDisplay;