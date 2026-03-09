/**
 * QuizModal: Modal de preguntas SST usando Design System
 * Se muestra cuando el jugador interactúa con un NPC
 */
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBridge } from '../game/utils/eventBridge';
import type { GameQuizQuestion } from '../types/game.types';

interface QuizModalProps {
  questions: GameQuizQuestion[];
}

export function QuizModal({ questions }: QuizModalProps) {
  const [visible, setVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questionQueue, setQuestionQueue] = useState<number[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const handleQuizStart = useCallback(
    (payload: unknown) => {
      const { questionIds } = payload as { npcId: string; questionIds: number[] };
      setQuestionQueue(questionIds);
      setQueueIndex(0);
      setSelectedAnswer(null);
      setAnswered(false);

      // Find first question
      const firstQ = questions.find((q) => q.id === questionIds[0]) || questions[0];
      if (firstQ) {
        setCurrentQuestion(firstQ);
        setVisible(true);
      }
    },
    [questions]
  );

  useEffect(() => {
    eventBridge.on('quiz:start', handleQuizStart);
    return () => {
      eventBridge.off('quiz:start', handleQuizStart);
    };
  }, [handleQuizStart]);

  const handleAnswer = (optionId: string) => {
    if (answered || !currentQuestion) return;

    setSelectedAnswer(optionId);
    setAnswered(true);

    const option = currentQuestion.opciones.find((o) => o.id === optionId);
    const correct = option?.es_correcta ?? false;

    eventBridge.emit('quiz:answer', {
      questionId: currentQuestion.id,
      answerId: optionId,
      correct,
    });
  };

  const handleNext = () => {
    const nextIndex = queueIndex + 1;
    if (nextIndex < questionQueue.length) {
      // More questions in queue
      setQueueIndex(nextIndex);
      const nextQ = questions.find((q) => q.id === questionQueue[nextIndex]);
      if (nextQ) {
        setCurrentQuestion(nextQ);
        setSelectedAnswer(null);
        setAnswered(false);
      }
    } else {
      // All done
      setVisible(false);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setAnswered(false);
      eventBridge.emit('quiz:close');
    }
  };

  if (!visible || !currentQuestion) return null;

  const correctOption = currentQuestion.opciones.find((o) => o.es_correcta);
  const isCorrect = selectedAnswer
    ? currentQuestion.opciones.find((o) => o.id === selectedAnswer)?.es_correcta
    : false;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-slate-700 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white">Riesgo Detectado</h3>
              <p className="text-[10px] text-slate-400">
                {currentQuestion.categoria_display} &middot; {currentQuestion.dificultad_display}
              </p>
            </div>
            <span className="ml-auto text-[10px] text-amber-400 font-mono">
              +{currentQuestion.puntos} XP
            </span>
          </div>

          {/* Question */}
          <div className="px-5 py-4">
            <p className="text-sm text-slate-200 leading-relaxed mb-4">
              {currentQuestion.pregunta}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.opciones.map((option) => {
                let borderColor = 'border-slate-700';
                let bgColor = 'bg-slate-800/50';
                let textColor = 'text-slate-300';

                if (answered) {
                  if (option.es_correcta) {
                    borderColor = 'border-green-500';
                    bgColor = 'bg-green-500/10';
                    textColor = 'text-green-300';
                  } else if (option.id === selectedAnswer && !option.es_correcta) {
                    borderColor = 'border-red-500';
                    bgColor = 'bg-red-500/10';
                    textColor = 'text-red-300';
                  }
                } else if (option.id === selectedAnswer) {
                  borderColor = 'border-blue-500';
                  bgColor = 'bg-blue-500/10';
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all
                      ${borderColor} ${bgColor} ${textColor}
                      ${!answered ? 'hover:border-blue-400 hover:bg-blue-500/5 cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <span className="text-xs leading-relaxed">{option.texto}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          {answered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-5 pb-4"
            >
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  isCorrect
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-xs font-semibold mb-1 ${isCorrect ? 'text-green-300' : 'text-red-300'}`}
                  >
                    {isCorrect
                      ? '¡Correcto!'
                      : `Incorrecto. La respuesta era: ${correctOption?.texto}`}
                  </p>
                  {currentQuestion.explicacion && (
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {currentQuestion.explicacion}
                    </p>
                  )}
                  {currentQuestion.norma_referencia && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <BookOpen className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500">
                        {currentQuestion.norma_referencia}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="mt-3 w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold transition-colors"
              >
                {queueIndex + 1 < questionQueue.length ? 'Siguiente Pregunta' : 'Continuar Misión'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
