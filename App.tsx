import React, { useState, useRef, useEffect } from 'react';
import { generateLearningModule, remixSentence } from './services/geminiService';
import { LearningModule, QuizQuestion, XPPacket } from './types';
import { XPFloat } from './components/XPFloat';

// --- Icons ---
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
);
const GamepadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const RemixIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function App() {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [moduleData, setModuleData] = useState<LearningModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState(0);
  const [xpPackets, setXpPackets] = useState<XPPacket[]>([]);
  const [remixLoadingId, setRemixLoadingId] = useState<number | null>(null);
  const [remixedTexts, setRemixedTexts] = useState<Record<number, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz State
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({}); // questionId -> selectedOptionId

  const awardXP = (amount: number, label: string, x: number = window.innerWidth / 2, y: number = window.innerHeight / 2) => {
    setXp(prev => prev + amount);
    const newPacket: XPPacket = {
      id: Date.now(),
      amount,
      label,
      x,
      y
    };
    setXpPackets(prev => [...prev, newPacket]);
    setTimeout(() => {
      setXpPackets(prev => prev.filter(p => p.id !== newPacket.id));
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage({ data: base64String, mimeType: file.type });
        awardXP(5, "IMAGE ADDED", window.innerWidth / 2, window.innerHeight / 2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && !selectedImage) return;
    setLoading(true);
    setModuleData(null);
    setAnsweredQuestions({});
    setRemixedTexts({});
    try {
      const data = await generateLearningModule(
        inputText, 
        selectedImage?.data, 
        selectedImage?.mimeType
      );
      setModuleData(data);
      awardXP(50, "MODULE UNLOCKED", window.innerWidth / 2, 200);
    } catch (error) {
      alert("Something went wrong transforming your content. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (question: QuizQuestion, optionId: string, event: React.MouseEvent) => {
    if (answeredQuestions[question.id]) return; // Already answered

    setAnsweredQuestions(prev => ({ ...prev, [question.id]: optionId }));

    if (optionId === question.correctAnswerId) {
      awardXP(10, "CORRECT!", event.clientX, event.clientY);
    } else {
      // Small vibration effect could go here
    }
  };

  const handleRemix = async (index: number, text: string, event: React.MouseEvent) => {
    if (remixLoadingId !== null) return;
    setRemixLoadingId(index);
    try {
      const result = await remixSentence(text);
      setRemixedTexts(prev => ({ ...prev, [index]: result }));
      awardXP(10, "REMIXED!", event.clientX, event.clientY);
    } catch (e) {
      console.error(e);
    } finally {
      setRemixLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:p-8 selection:bg-pink-500 selection:text-white">
      <XPFloat packets={xpPackets} />
      
      {/* Header / Stats */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl backdrop-blur-md border border-slate-700 sticky top-4 z-40 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-lg shadow-lg shadow-purple-500/20">
            <BrainIcon />
          </div>
          <h1 className="font-black text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
            FocusFlow
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Score</p>
            <p className="font-mono text-xl text-yellow-400 leading-none">{xp} XP</p>
          </div>
          <div className="h-10 w-10 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center relative">
            <BoltIcon />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Input Section (Only show if no data or if specifically requested to reset, here we just show if !moduleData) */}
      {!moduleData && (
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-800 rounded-3xl p-1 border border-slate-700 shadow-2xl">
            <div className="bg-slate-900/50 rounded-[22px] p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
                Turn <span className="text-slate-500 line-through decoration-red-500">boring stuff</span> into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">Knowledge Game</span>.
              </h2>
              
              <div className="relative mb-4">
                <textarea
                  className="w-full h-48 bg-slate-950/50 border-2 border-slate-700 rounded-xl p-4 text-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none resize-none font-medium placeholder:text-slate-600"
                  placeholder="Paste text here OR upload an image..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                
                {/* Image Upload Button */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-lg transition-colors border border-slate-600 flex items-center gap-2 text-sm font-semibold"
                    title="Upload Image"
                  >
                    <ImageIcon />
                    {selectedImage ? "Image Added!" : "Add Image"}
                  </button>
                </div>
              </div>

              {selectedImage && (
                <div className="mb-4 p-2 bg-slate-950/50 rounded-xl border border-slate-700 flex justify-between items-center animate-in fade-in zoom-in duration-300">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Preview" className="h-full w-full object-cover" />
                     </div>
                     <span className="text-sm text-green-400 font-bold">Image ready for analysis!</span>
                   </div>
                   <button 
                     onClick={() => setSelectedImage(null)}
                     className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1"
                   >
                     REMOVE
                   </button>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || (!inputText && !selectedImage)}
                className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all transform active:scale-95 shadow-lg ${
                  loading || (!inputText && !selectedImage)
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-purple-500/30 hover:shadow-purple-500/50'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gamifying...
                  </span>
                ) : (
                  "✨ Focusify It! ✨"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module View */}
      {moduleData && (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-700 pb-20">
          
          <button 
            onClick={() => { setModuleData(null); setInputText(""); setSelectedImage(null); }}
            className="text-sm text-slate-400 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-white transition-colors"
          >
            ← Start New Session
          </button>

          {/* 1. TL;DR */}
          <section className="bg-gradient-to-br from-indigo-900 to-slate-900 border-l-8 border-indigo-500 rounded-r-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BrainIcon />
             </div>
             <h3 className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-2">🧠 The TL;DR</h3>
             <p className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
               {moduleData.tldr}
             </p>
          </section>

          {/* Grid for Map & Analogy */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* 2. Visual Map */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col h-full hover:border-blue-500/50 transition-colors duration-300 min-w-0">
               <h3 className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                 <span>🎨 Visual Map</span>
                 <span className="h-px flex-1 bg-slate-700"></span>
               </h3>
               <div className="bg-slate-950 rounded-lg p-4 font-mono text-[10px] sm:text-xs md:text-sm text-green-400 whitespace-pre overflow-x-auto custom-scrollbar shadow-inner border border-slate-800 flex-grow flex items-center justify-center w-full">
                 {moduleData.visualMap}
               </div>
            </section>

            {/* 3. Analogy */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col h-full hover:border-pink-500/50 transition-colors duration-300">
               <h3 className="text-pink-400 text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                 <span>🕹️ The Analogy</span>
                 <span className="h-px flex-1 bg-slate-700"></span>
               </h3>
               <div className="flex-grow flex flex-col justify-center">
                  <div className="mb-4 text-pink-500 opacity-80">
                    <GamepadIcon />
                  </div>
                  <p className="text-lg text-slate-200 font-medium leading-relaxed">
                    {moduleData.analogy}
                  </p>
               </div>
            </section>
          </div>

          {/* 4. Bite-Sized Breakdown */}
          <section className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-xl">
             <h3 className="text-yellow-400 text-sm font-bold tracking-widest uppercase mb-6">📝 Bite-Sized Breakdown</h3>
             <div className="space-y-4">
               {moduleData.breakdown.map((item, idx) => (
                 <div key={idx} className="group relative bg-slate-900 border border-slate-700 hover:border-yellow-500/50 rounded-xl p-4 transition-all hover:translate-x-1">
                   {remixedTexts[idx] ? (
                     <div className="animate-in zoom-in duration-300 bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
                        <p className="text-yellow-200 font-bold text-lg mb-1">👶 5-Year-Old Remix:</p>
                        <p className="text-white text-lg">{remixedTexts[idx]}</p>
                     </div>
                   ) : (
                    <div className="flex items-start gap-4">
                      <span className="text-3xl filter drop-shadow-md shrink-0">{item.emoji}</span>
                      <div className="flex-1">
                        <p className="text-lg text-slate-300 font-medium leading-snug">
                          {item.text.split(item.boldKeyTerm).map((part, i, arr) => (
                            <React.Fragment key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <span className="text-white font-black bg-white/10 px-1 rounded mx-0.5">
                                  {item.boldKeyTerm}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleRemix(idx, `${item.emoji} ${item.text}`, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-yellow-400 p-2 rounded-lg border border-slate-700"
                        title="Remix: Explain this simply!"
                      >
                         {remixLoadingId === idx ? (
                           <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         ) : <RemixIcon />}
                      </button>
                    </div>
                   )}
                 </div>
               ))}
             </div>
          </section>

          {/* 5. Gamified Quiz */}
          <section className="bg-slate-900 border-2 border-purple-900/50 rounded-3xl p-6 md:p-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
             
             <div className="flex justify-between items-end mb-8">
               <h3 className="text-purple-400 text-sm font-bold tracking-widest uppercase">🏆 Quick Check-in</h3>
               <span className="text-xs text-slate-500 font-mono">EARN UP TO {moduleData.quiz.length * 10} XP</span>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
               {moduleData.quiz.map((q) => {
                 const isAnswered = !!answeredQuestions[q.id];
                 const isCorrect = answeredQuestions[q.id] === q.correctAnswerId;

                 return (
                  <div key={q.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col">
                    <h4 className="font-bold text-lg mb-4 text-white leading-tight">{q.question}</h4>
                    <div className="space-y-2 flex-grow">
                      {q.options.map((opt) => {
                         let btnClass = "w-full text-left p-3 rounded-xl border transition-all text-sm font-semibold flex justify-between items-center ";
                         
                         if (isAnswered) {
                            if (opt.id === q.correctAnswerId) {
                                btnClass += "bg-green-500/20 border-green-500 text-green-300";
                            } else if (opt.id === answeredQuestions[q.id]) {
                                btnClass += "bg-red-500/20 border-red-500 text-red-300 opacity-50";
                            } else {
                                btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                            }
                         } else {
                            btnClass += "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-purple-500 text-slate-300";
                         }

                         return (
                          <button
                            key={opt.id}
                            onClick={(e) => handleQuizAnswer(q, opt.id, e)}
                            disabled={isAnswered}
                            className={btnClass}
                          >
                            <span><span className="opacity-50 mr-2">{opt.id})</span> {opt.text}</span>
                            {isAnswered && opt.id === q.correctAnswerId && (
                                <span className="text-green-400">✓</span>
                            )}
                          </button>
                         );
                      })}
                    </div>
                    {isAnswered && (
                        <div className={`mt-4 text-xs p-3 rounded-lg border ${isCorrect ? 'bg-green-900/20 border-green-900/50 text-green-200' : 'bg-red-900/20 border-red-900/50 text-red-200'}`}>
                            <strong>{isCorrect ? 'Nailed it!' : 'Not quite.'}</strong> {q.explanation}
                        </div>
                    )}
                  </div>
                 );
               })}
             </div>

             {/* Footer XP Message */}
             <div className="mt-8 text-center p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-slate-400 text-sm">
                  🔐 ANSWERS REVEALED INSTANTLY • +10 XP PER CORRECT ANSWER
                </p>
             </div>
          </section>
        </div>
      )}
    </div>
  );
}