import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Trophy,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { tutorialService } from "@/services/tutorialService";
import { studySessionService } from "@/services/studySessionService";

interface QuizQuestion {
  question_id: string;
  question: string;
  question_type: "mcq" | "descriptive";
  options?: string[];
  correct_answer_index?: number;
  expected_answer?: string;
}

const Quiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isStudySession, setIsStudySession] = useState(false);
  const [hasEvaluationReport, setHasEvaluationReport] = useState(false);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      // Check if quiz data was passed from StudyMode
      const locationState = location.state as any;
      if (locationState?.quizData && locationState?.isStudySession) {
        // Use the quiz data from state
        setIsStudySession(true);
        const quizData = locationState.quizData;
        setQuizDetails({
          ...quizData,
          tutorial_title: locationState.sessionName || "Study Session Quiz",
        });

        // Combine questions with type information
        const mcqQuestions = (quizData.mcq_questions || []).map((q: any) => ({
          ...q,
          question_type: "mcq" as const,
        }));
        const descriptiveQuestions = (quizData.descriptive_questions || []).map((q: any) => ({
          ...q,
          question_type: "descriptive" as const,
        }));

        setQuizQuestions([...mcqQuestions, ...descriptiveQuestions]);
        
        // Check if quiz has been evaluated
        if (quizData.is_evaluated && quizData.evaluation_report) {
          setHasEvaluationReport(true);
        }
      } else {
        // Fetch quiz from tutorial service (existing behavior)
        const response = await tutorialService.getQuizDetails(quizId!);
        setQuizDetails(response);

        // Combine questions with type information
        const mcqQuestions = (response.mcq_questions || []).map((q: any) => ({
          ...q,
          question_type: "mcq" as const,
        }));
        const descriptiveQuestions = (response.descriptive_questions || []).map((q: any) => ({
          ...q,
          question_type: "descriptive" as const,
        }));

        setQuizQuestions([...mcqQuestions, ...descriptiveQuestions]);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Load Quiz",
        description: error.message,
        variant: "destructive",
      });
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const submitQuiz = async () => {
    if (!quizId) return;

    setIsSubmitting(true);
    try {
      const answersArray = Object.entries(quizAnswers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer,
      }));

      // Use different endpoint based on quiz type
      const response = isStudySession
        ? await studySessionService.evaluateQuiz(quizId, answersArray)
        : await tutorialService.submitQuiz({
            quiz_id: quizId,
            answers: answersArray as any,
          });

      setQuizResult(response);
      setShowResults(true);
      
      toast({
        title: "Quiz Submitted!",
        description: `You scored ${response.percentage}%`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Submit Quiz",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const retakeQuiz = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const viewEvaluationResults = () => {
    if (quizDetails?.evaluation_report) {
      setQuizResult(quizDetails.evaluation_report);
      setShowResults(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showResults && quizResult) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="container max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            className="mb-4 sm:mb-6 gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isStudySession ? "Back to Study Session" : "Back to Tutorial"}</span>
            <span className="sm:hidden">Back</span>
          </Button>

          {/* Results Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {quizDetails?.tutorial_title}
            </p>
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-4">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-primary">
                  {quizResult.percentage}%
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Overall Score</p>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {quizResult.correct_answers}/{quizResult.total_questions}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Correct Answers</p>
              </div>
            </div>
          </motion.div>

          {/* Detailed Feedback */}
          {quizResult.overall_feedback && (
            <Card className="glass border-border mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Overall Feedback</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{quizResult.overall_feedback}</p>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {quizResult.strengths && quizResult.strengths.length > 0 && (
              <Card className="glass border-border border-green-500/50">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-green-600">Strengths</h3>
                  <ul className="space-y-2">
                    {quizResult.strengths.map((strength: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {quizResult.areas_for_improvement && quizResult.areas_for_improvement.length > 0 && (
              <Card className="glass border-border border-orange-500/50">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-orange-600">
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {quizResult.areas_for_improvement.map((area: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Study Suggestions */}
          {quizResult.study_suggestions && quizResult.study_suggestions.length > 0 && (
            <Card className="glass border-border mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Study Suggestions</h3>
                <ul className="space-y-2">
                  {quizResult.study_suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold">Question by Question Review</h3>
            <div className="max-h-96 overflow-y-auto space-y-3 sm:space-y-4">
              {quizResult.results?.map((result: any, index: number) => (
                <Card
                  key={index}
                  className={`${
                    result.is_correct ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 ${
                          result.is_correct ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {result.is_correct ? "✓" : "✗"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium mb-2">{result.question}</p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">
                              Your Answer:{" "}
                            </span>
                            <span
                              className={result.is_correct ? "text-green-600" : "text-red-600"}
                            >
                              {typeof result.user_answer === "number"
                                ? `Option ${String.fromCharCode(65 + result.user_answer)}`
                                : result.user_answer}
                            </span>
                          </div>
                          {!result.is_correct && result.correct_answer !== undefined && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Correct Answer:{" "}
                              </span>
                              <span className="text-green-600">
                                {typeof result.correct_answer === "number"
                                  ? `Option ${String.fromCharCode(65 + result.correct_answer)}`
                                  : result.correct_answer}
                              </span>
                            </div>
                          )}
                          {result.feedback && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Feedback:{" "}
                              </span>
                              <span>{result.feedback}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-muted-foreground">Score: </span>
                            <span>
                              {result.score}/{result.max_score} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button onClick={retakeQuiz} variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </Button>
            <Button
              onClick={() => navigate(-1)}
              size="sm"
              className="bg-gradient-to-r from-primary to-secondary w-full sm:w-auto"
            >
              <span className="hidden sm:inline">{isStudySession ? "Back to Study Session" : "Back to Tutorial"}</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-center flex-1 w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Practice Test</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {quizDetails?.tutorial_title}
            </p>
          </div>
          {hasEvaluationReport && !showResults && (
            <Button
              onClick={viewEvaluationResults}
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">View Results</span>
              <span className="sm:hidden">Results</span>
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {Object.keys(quizAnswers).length} answered
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Navigation Dots */}
        <div className="flex gap-2 flex-wrap mb-4 sm:mb-6 max-h-20 overflow-y-auto">
          {quizQuestions.map((_, index) => (
            <button
              key={index}
              onClick={() => goToQuestion(index)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                index === currentQuestionIndex
                  ? "bg-primary text-primary-foreground"
                  : quizAnswers[quizQuestions[index]?.question_id]
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="glass border-border mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Badge
                    variant={
                      currentQuestion.question_type === "mcq" ? "default" : "secondary"
                    }
                  >
                    {currentQuestion.question_type === "mcq"
                      ? "Multiple Choice"
                      : "Descriptive"}
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">{currentQuestion.question}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {currentQuestion.question_type === "mcq"
                    ? "Select the correct answer from the options below"
                    : "Type your detailed answer in the text area below"}
                </p>
              </CardContent>
            </Card>

            {currentQuestion.question_type === "mcq" ? (
              /* MCQ Options */
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {currentQuestion.options?.map((option: string, optionIndex: number) => (
                  <button
                    key={optionIndex}
                    onClick={() =>
                      handleAnswerSelect(currentQuestion.question_id, optionIndex)
                    }
                    className={`p-3 sm:p-4 text-left rounded-lg border transition-all duration-200 hover:shadow-md ${
                      Number(quizAnswers[currentQuestion.question_id]) === optionIndex
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm ${
                          Number(quizAnswers[currentQuestion.question_id]) === optionIndex
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <span className="flex-1 text-sm leading-tight">{option}</span>
                      {Number(quizAnswers[currentQuestion.question_id]) === optionIndex && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Descriptive Answer */
              <Card className="glass border-border mb-4 sm:mb-6">
                <CardContent className="p-3 sm:p-4">
                  <Label htmlFor="descriptive-answer" className="text-sm font-medium mb-2 block">
                    Your Answer
                  </Label>
                  <Textarea
                    id="descriptive-answer"
                    value={(quizAnswers[currentQuestion.question_id] as string) || ""}
                    onChange={(e) =>
                      handleAnswerSelect(currentQuestion.question_id, e.target.value)
                    }
                    placeholder="Type your detailed answer here..."
                    className="min-h-[200px] max-h-[300px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {((quizAnswers[currentQuestion.question_id] as string) || "").length}{" "}
                    characters
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <div className="flex gap-2 flex-1 sm:flex-none">
            {currentQuestionIndex === quizQuestions.length - 1 ? (
              <Button
                onClick={submitQuiz}
                disabled={isSubmitting || Object.keys(quizAnswers).length === 0}
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Submitting...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Submit Quiz</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === quizQuestions.length - 1}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;

