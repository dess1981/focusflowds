import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function VoiceTaskInput({ onTaskCreated }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTask, setLastTask] = useState(null);
  const recognitionRef = useRef(null);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition não suportado neste navegador');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          interim += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      setTranscript(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        processVoiceCommand(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Erro na captura de voz:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceCommand = async (voiceText) => {
    setIsProcessing(true);
    try {
      // Usar IA para extrair tarefa, prioridade e categoria
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente de tarefas. Analise este comando de voz em português e extraia uma tarefa estruturada:

"${voiceText}"

Retorne um JSON com:
- title: (título da tarefa, máx 100 caracteres)
- description: (descrição opcional)
- priority: (urgent, high, medium ou low - baseado em palavras-chave)
- category: (trabalho, pessoal, saúde, compras ou outro se mencionado)
- due_date: (data se mencionada, formato YYYY-MM-DD, ou null)

Exemplo:
{"title": "Comprar leite", "description": "", "priority": "medium", "category": "compras", "due_date": null}`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
            category: { type: 'string' },
            due_date: { type: 'string' }
          }
        }
      });

      const taskData = result.data;

      // Criar tarefa
      const newTask = await base44.entities.Task.create({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority,
        status: 'todo',
        due_date: taskData.due_date || null
      });

      setLastTask(newTask);
      setTranscript('');

      // Feedback sonoro
      playSuccessSound();

      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setLastTask(null), 3000);
    } catch (error) {
      console.error('Erro ao processar comando de voz:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-32 lg:bottom-8 right-6 lg:right-8 flex flex-col items-end gap-3 z-40">
        {/* Feedback de transcrição */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card border border-border rounded-lg p-3 max-w-xs shadow-lg"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">Ouvindo...</p>
            <p className="text-sm">{transcript}</p>
          </motion.div>
        )}

        {/* Feedback de sucesso */}
        {lastTask && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 max-w-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-green-600">Tarefa criada!</p>
              <p className="text-sm text-green-600 truncate">{lastTask.title}</p>
            </div>
          </motion.div>
        )}

        {/* Botão de voz flutuante */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-primary hover:bg-primary/90'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isListening ? (
            <>
              <MicOff className="w-6 h-6 text-white" />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 border-2 border-red-400 rounded-full opacity-0"
              />
            </>
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}

          {/* Label tooltip */}
          <div className="absolute bottom-full mb-2 bg-background border border-border rounded-lg px-3 py-1 text-xs whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isListening ? 'Parar' : 'Ditar tarefa'}
          </div>
        </motion.button>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-right">
          🎤 Comandos de voz
          <br />
          Siri • Google • Web
        </p>
      </div>
    </AnimatePresence>
  );
}