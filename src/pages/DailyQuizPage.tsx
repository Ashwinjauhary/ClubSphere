import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Loader2, Trophy, Clock, CheckCircle2, BrainCircuit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

export const DailyQuizPage = () => {
    const { role } = useAuthStore();
    const isSpectator = role === 'admin' || role === 'dean' || role === 'super_admin';
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [quiz, setQuiz] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [questions, setQuestions] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [attempt, setAttempt] = useState<any>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [currentQIndex, setCurrentQIndex] = useState(0);

    useEffect(() => {
        loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadQuiz = async (retry = false) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // 1. Get Quiz Metadata
            const { data: quizData, error: quizError } = await supabase
                .from('daily_quizzes')
                .select('*')
                .eq('date', today)
                .maybeSingle();

            if (quizError) throw quizError;

            // 2. LAZY GENERATION: If no quiz exists, trigger generation
            if (!quizData) {
                if (retry) {
                    console.log("Quiz generation incomplete or failed on retry.");
                    setLoading(false);
                    return;
                }

                // Show generating message
                toast.info("First visitor bonus! Generating today's quiz... 🧠");

                // Call Edge Function
                const { error: genError } = await supabase.functions.invoke('generate-daily-quiz', {
                    body: {}
                });

                if (genError) {
                    console.error("Generation failed:", genError);
                    toast.error("Failed to generate quiz");
                    setLoading(false);
                    return;
                }

                // Wait 2 seconds for DB propagation then retry
                setTimeout(() => loadQuiz(true), 2000);
                return; // Exit this execution, retry will handle the rest
            }

            setQuiz(quizData);

            // 3. Check Attempt (Only for students)
            if (!isSpectator) {
                const { data: attemptData } = await supabase
                    .from('quiz_attempts')
                    .select('*')
                    .eq('quiz_id', quizData.id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (attemptData) {
                    setAttempt(attemptData);
                }
            }

            // 4. Load Questions (Always load if we have a quiz)
            const { data: qData, error: qError } = await supabase
                .from('quiz_questions')
                .select('id, question, options')
                .eq('quiz_id', quizData.id);

            if (qError) throw qError;
            setQuestions(qData || []);
            setLoading(false);

        } catch (error) {
            console.error('Error loading quiz:', error);
            toast.error('Failed to load daily quiz');
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: string, option: string) => {
        if (isSpectator) return; // Read-only
        setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const submitQuiz = async () => {
        if (isSpectator) {
            toast.info("Admins are just observing! 🧐");
            return;
        }

        if (Object.keys(selectedAnswers).length < questions.length) {
            toast.error('Please answer all questions');
            return;
        }

        setSubmitting(true);
        try {
            // Call Secure RPC
            const { data, error } = await supabase.rpc('submit_quiz', {
                p_quiz_id: quiz.id,
                p_answers: selectedAnswers
            });

            if (error) throw error;

            if (data.success) {
                setAttempt({
                    score: data.score,
                    xp_earned: data.xp_earned,
                    total: data.total
                });
                toast.success(`Quiz Completed! You earned ${data.xp_earned} XP`);
                if (data.score > data.total / 2) {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            } else {
                toast.error(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    if (!quiz) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 m-8">
                <BrainCircuit className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">No Quiz Available Yet</h2>
                <p className="text-gray-500 mt-2">The AI is preparing today's challenge. Check back at 4:00 AM!</p>
            </div>
        );
    }

    if (attempt) {
        return (
            <div className="max-w-2xl mx-auto py-6 sm:py-12 px-4">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-center p-6 sm:p-8 border border-brand-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full mb-6">
                        <Trophy className="h-10 w-10 text-yellow-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
                    <p className="text-gray-500 mb-8">You have already attempted today's challenge.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-xl">
                            <span className="block text-sm text-blue-600 font-medium tracking-wide uppercase">Score</span>
                            <span className="text-2xl sm:text-3xl font-black text-blue-900">{attempt.score}/{questions.length || attempt.total || '?'}</span>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl">
                            <span className="block text-sm text-purple-600 font-medium tracking-wide uppercase">XP Earned</span>
                            <span className="text-2xl sm:text-3xl font-black text-purple-900">+{attempt.xp_earned}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                        Come back tomorrow for a new set of questions!
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQIndex];

    return (
        <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4">
            <PageHeader
                title={`Daily Challenge: ${quiz.topic}`}
                description={format(new Date(quiz.date), 'EEEE, MMMM do, yyyy')}
                action={
                    isSpectator ? (
                        <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium border border-amber-200">
                            <Eye className="h-4 w-4 mr-2" /> Spectator Mode
                        </div>
                    ) : (
                        <div className="flex items-center text-brand-600 bg-brand-50 px-3 py-1 rounded-full text-sm font-medium"><Clock className="h-4 w-4 mr-2" />Resets at 4 AM</div>
                    )
                }
            />

            {isSpectator && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-center">
                    <Eye className="h-5 w-5 mr-3 flex-shrink-0" />
                    As an Administrator, you can view the quiz questions but cannot submit answers for XP.
                </div>
            )}

            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 w-full">
                    <div
                        className="h-full bg-brand-600 transition-all duration-300"
                        style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>

                <div className="p-5 sm:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium text-gray-400">Question {currentQIndex + 1} of {questions.length}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">10 XP</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8 leading-relaxed">
                        {currentQ.question}
                    </h3>

                    <div className="space-y-3">
                        {currentQ.options.map((option: string, idx: number) => {
                            const isSelected = selectedAnswers[currentQ.id] === option;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(currentQ.id, option)}
                                    disabled={isSpectator}
                                    className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                                        ${isSelected
                                            ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm'
                                            : isSpectator
                                                ? 'border-gray-100 text-gray-500 cursor-not-allowed'
                                                : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <span className="flex items-center">
                                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-3 sm:mr-4 text-xs sm:text-sm font-bold border ${isSelected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-400 border-gray-200'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-sm sm:text-base">{option}</span>
                                    </span>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600 flex-shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gray-50 px-4 sm:px-8 py-4 flex justify-between items-center border-t border-gray-100">
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentQIndex(i => Math.max(0, i - 1))}
                        disabled={currentQIndex === 0}
                    >
                        Previous
                    </Button>

                    {currentQIndex === questions.length - 1 ? (
                        <Button
                            onClick={submitQuiz}
                            disabled={submitting || (Object.keys(selectedAnswers).length < questions.length && !isSpectator) || isSpectator}
                            className={`text-white ${isSpectator ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            {isSpectator ? 'Spectator Mode' : 'Submit Quiz'}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQIndex(i => Math.min(questions.length - 1, i + 1))}
                            disabled={!selectedAnswers[currentQ.id] && !isSpectator} // Allow admin to proceed freely
                        >
                            Next Question
                        </Button>
                    )}
                </div>
            </div>
        </div >
    );
};
