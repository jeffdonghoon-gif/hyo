/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Share2, AlertCircle, Sparkles, Heart, Award, Download, X, ChevronRight, CreditCard } from 'lucide-react';
import solarLunar from 'solarlunar';
import confetti from 'canvas-confetti';

// Types for the solarLunar library
interface SolarLunarResult {
  lYear: number;
  lMonth: number;
  lDay: number;
  animal: string;
  monthCn: string;
  dayCn: string;
  cYear: number;
  cMonth: number;
  cDay: number;
  gzYear: string;
  gzMonth: string;
  gzDay: string;
  isLeap: boolean;
  nWeek: number;
  ncWeek: string;
  term: string | null;
}

export default function App() {
  const [birthday, setBirthday] = useState('');
  const [checks, setChecks] = useState([false, false, false]);
  const [result, setResult] = useState<{
    month: number;
    day: number;
    weekDay: string;
    originalDate: string;
  } | null>(null);
  
  // App States: 'initial' | 'input' | 'failure' | 'askingMom' | 'result'
  const [appState, setAppState] = useState<'initial' | 'input' | 'failure' | 'askingMom' | 'result'>('initial');
  const [timer, setTimer] = useState(10);
  const [timerMessage, setTimerMessage] = useState('');
  const [hasTriggeredInput, setHasTriggeredInput] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [modalStep, setModalStep] = useState<'input' | 'preview' | 'payment'>('input');
  const [childName, setChildName] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState<'traditional' | 'modern'>('traditional');
  const [previews, setPreviews] = useState<{ traditional: string; modern: string }>({ traditional: '', modern: '' });

  const checkedCount = checks.filter(c => c === true).length;

  // Trigger input state when 2 or more checked
  useEffect(() => {
    if (checkedCount >= 2 && !hasTriggeredInput && appState === 'initial') {
      setHasTriggeredInput(true);
      setAppState('input');
      setTimer(10);
    }
  }, [checkedCount, hasTriggeredInput, appState]);

  // Update timer message based on checked count
  useEffect(() => {
    if (appState === 'input') {
      if (checkedCount === 3) {
        setTimerMessage('완벽한 불효자 후보시군요. 10초 드립니다. 실시!');
      } else if (checkedCount === 2) {
        setTimerMessage('불효 수치 위험! 지금 당장 입력해서 증명하세요!');
      }
    }
  }, [checkedCount, appState]);

  // Handle countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (appState === 'input' && birthday.length < 6) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setAppState('failure');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [appState, birthday.length]);

  const toggleCheck = (index: number) => {
    // Short vibration effect
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const calculateBirthday = () => {
    if (birthday.length !== 6) return;

    const yy = parseInt(birthday.substring(0, 2));
    const mm = parseInt(birthday.substring(2, 4));
    const dd = parseInt(birthday.substring(4, 6));

    const year = yy > 26 ? 1900 + yy : 2000 + yy;

    try {
      const lunarInfo = solarLunar.solar2lunar(year, mm, dd) as SolarLunarResult;
      const currentYear = 2026;
      const solarInfo = solarLunar.lunar2solar(currentYear, lunarInfo.lMonth, lunarInfo.lDay, lunarInfo.isLeap) as SolarLunarResult;

      const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekDay = weekDays[solarInfo.nWeek % 7];

      setResult({
        month: solarInfo.cMonth,
        day: solarInfo.cDay,
        weekDay: weekDay,
        originalDate: `${mm}월 ${dd}일`
      });
      setAppState('result');
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6D00', '#FFD600', '#4CAF50', '#2196F3']
      });
    } catch (e) {
      alert('날짜 계산 중 오류가 발생했습니다. 올바른 날짜인지 확인해주세요!');
    }
  };

  const handleRetry = () => {
    setBirthday('');
    setTimer(10);
    setTimerMessage('이번엔 진짜 아시는 거 맞죠? 시작합니다!');
    setAppState('input');
  };

  const handleAskMom = () => {
    setAppState('askingMom');
  };

  const handleOpenCertificateModal = () => {
    setModalStep('input');
    setShowCertificateModal(true);
  };

  const handleGeneratePreviews = () => {
    if (!childName.trim()) {
      alert('본인 이름을 입력해주세요!');
      return;
    }
    
    const traditionalPreview = generateCertificateDataUrl('traditional', true);
    const modernPreview = generateCertificateDataUrl('modern', true);
    
    Promise.all([traditionalPreview, modernPreview]).then(([trad, mod]) => {
      console.log('Previews generated:', { trad: !!trad, mod: !!mod });
      setPreviews({
        traditional: trad || '',
        modern: mod || ''
      });
      setModalStep('preview');
    });
  };

  const handleSelectTemplate = (template: 'traditional' | 'modern') => {
    setSelectedTemplate(template);
    setModalStep('payment');
  };

  const handleFinalPayment = async () => {
    alert('기부에 동참해주셔서 감사합니다. 고화질 임명장 다운로드를 시작합니다.');
    const finalImage = await generateCertificateDataUrl(selectedTemplate, false);
    if (finalImage) {
      const link = document.createElement('a');
      link.download = `명예효자임명장_${childName}.png`;
      link.href = finalImage;
      link.click();
    }
    setShowCertificateModal(false);
    setChildName('');
  };

  const generateCertificateDataUrl = async (template: 'traditional' | 'modern', isPreview: boolean): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1131;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (template === 'traditional') {
      // Traditional Template - Image Synthesis with 임명장_전통형.png
      return new Promise((resolve) => {
        const img = new Image();
        img.src = "/cert_traditional.png"; 
        
        img.onload = async () => {
          console.log('Image loaded:', img.src);
          try {
            // Ensure font is loaded with timeout
            await Promise.race([
              Promise.all([
                document.fonts.load('bold 42px "Hahmlet"'),
                document.fonts.load('bold 34px "Hahmlet"')
              ]),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Font timeout')), 5000))
            ]);
            console.log('Fonts loaded successfully');
          } catch (e) {
            console.warn('Font loading failed or timed out', e);
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);

          // Synthesis Text: Name
          ctx.fillStyle = '#111111'; // Deep ink color
          ctx.font = 'bold 42px "Hahmlet"';
          ctx.textAlign = 'left';
          
          // Position for childName next to "성명: " in 임명장_전통형.png
          const nameX = canvas.width * 0.54; 
          const nameY = canvas.height * 0.352; 
          
          ctx.fillText(childName, nameX, nameY);

          // Synthesis Text: Date
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          
          ctx.font = 'bold 34px "Hahmlet"';
          ctx.textAlign = 'center';
          const dateX = canvas.width * 0.51;
          const dateY = canvas.height * 0.708;
          
          ctx.fillText(`${year}년 ${month}월 ${day}일`, dateX, dateY);

          // Watermark for preview
          if (isPreview) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.font = 'bold 100px sans-serif';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.textAlign = 'center';
            ctx.fillText('PREVIEW', 0, -50);
            ctx.fillText('SAMPLE', 0, 50);
            ctx.restore();
          }

          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
          // Fallback if image fails to load
          ctx.fillStyle = '#fdfbf0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#111';
          ctx.font = '24px "Nanum Gothic"';
          ctx.textAlign = 'center';
          ctx.fillText('전통형 배경 이미지를 불러올 수 없습니다.', canvas.width / 2, canvas.height / 2);
          ctx.fillText('(cert_traditional.png)', canvas.width / 2, canvas.height / 2 + 30);
          resolve(canvas.toDataURL('image/png'));
        };
      });
    }

    if (template === 'modern') {
      // Modern Template - Image Synthesis with 임명장_현대형.png
      return new Promise((resolve) => {
        const img = new Image();
        img.src = "/cert_modern.png"; 
        
        img.onload = async () => {
          console.log('Image loaded:', img.src);
          try {
            // Ensure font is loaded with timeout
            await Promise.race([
              Promise.all([
                document.fonts.load('50px "Nanum Brush Script"'),
                document.fonts.load('26px "Nanum Brush Script"')
              ]),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Font timeout')), 5000))
            ]);
            console.log('Fonts loaded successfully');
          } catch (e) {
            console.warn('Font loading failed or timed out', e);
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);

          // Synthesis Text: Name
          ctx.fillStyle = '#1e293b'; // Slate 800
          ctx.font = '50px "Nanum Brush Script"';
          ctx.textAlign = 'center';
          
          // Position for name in 임명장_현대형.png (centered between title and body)
          const nameX = canvas.width * 0.5; 
          const nameY = canvas.height * 0.34; 
          
          ctx.fillText(childName, nameX, nameY);

          // Synthesis Text: Date
          const today = new Date();
          const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
          
          ctx.font = '26px "Nanum Brush Script"';
          ctx.fillStyle = '#475569';
          const dateX = canvas.width * 0.5;
          const dateY = canvas.height * 0.92;
          
          ctx.fillText(dateStr, dateX, dateY);

          // Watermark for preview
          if (isPreview) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.font = 'bold 100px sans-serif';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.textAlign = 'center';
            ctx.fillText('PREVIEW', 0, -50);
            ctx.fillText('SAMPLE', 0, 50);
            ctx.restore();
          }

          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
          // Fallback if image fails to load
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#111';
          ctx.font = '24px "Nanum Gothic"';
          ctx.textAlign = 'center';
          ctx.fillText('현대형 배경 이미지를 불러올 수 없습니다.', canvas.width / 2, canvas.height / 2);
          ctx.fillText('(cert_modern.png)', canvas.width / 2, canvas.height / 2 + 30);
          resolve(canvas.toDataURL('image/png'));
        };
      });
    }

    // Donation Footer
    ctx.font = 'italic 16px serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('본 임명장의 수익금 일부는 홀로 계신 어르신들을 위해 기부됩니다.', canvas.width / 2, 1050);

    // Watermark for preview
    if (isPreview) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.font = 'bold 100px sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.textAlign = 'center';
      ctx.fillText('PREVIEW', 0, -50);
      ctx.fillText('SAMPLE', 0, 50);
      ctx.restore();
      
      // Low res effect (optional, just scaling down/up would work but here we just use the watermark)
    }

    return canvas.toDataURL('image/png');
  };

  return (
    <div className="min-h-screen font-sans pb-20 px-4 max-w-md mx-auto">
      {/* Header Section */}
      <header className="pt-10 pb-6 text-center relative">
        <div className="relative w-48 h-48 mx-auto mb-6 bg-orange-100 rounded-full border-4 border-black flex items-center justify-center overflow-hidden cartoon-border">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbtIofLuZivUa0zJ24jJszKyb5-JCSlXSMtH8qJMeHDsh1TrZH3-BgmYhekD9pdpkYwArlSTZNnZS-0qSoSYIWbECgPTd1sIUtGglbxP_oRX-BqDtVDNIzmSzc-kbjU2OARfxxt6wV9Ie4_U3-ujahIVdk_NpPMhP6LP7mFM1KCiQkX0NqedXOFPsa0fF6eifZUnxO9JLxUJVANkNhIgGyE-FInnbcIyrocH4Ou9xRi3IqNuYCd22GUIfysTKRDw7RjJkBL2slXq4" 
            alt="Character" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-4 right-4 text-red-500"
          >
            <Heart fill="currentColor" size={32} />
          </motion.div>
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute bottom-6 left-4 text-yellow-400"
          >
            <Sparkles size={24} />
          </motion.div>
        </div>
        
        <h1 className="font-gaegu text-4xl font-bold text-[#E65100] mb-3 tracking-tight">
          전국 불효자 방지 위원회
        </h1>
        
        <div className="inline-block bg-white border-2 border-black rounded-full px-4 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-slate-600">
            "당신의 등 뒤가 서늘하다면? 지금 바로 체크!"
          </p>
        </div>
      </header>

      {/* Checklist Section */}
      <section className="bg-white cartoon-border p-6 rounded-3xl mb-8">
        <h2 className="font-gaegu text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-3xl">📝</span> 불효 수치 자가 진단
        </h2>
        
        <div className="space-y-4">
          {[
            { text: "부모님 생신 까먹은 적 있음?", color: "bg-orange-50 border-orange-200", activeColor: "bg-orange-200 border-orange-400" },
            { text: "가짜 알람 때문에 어색한 전화해 봄?", color: "bg-green-50 border-green-200", activeColor: "bg-green-200 border-green-400" },
            { text: "용돈 드릴 때 손이 떨린 적 있음?", color: "bg-blue-50 border-blue-200", activeColor: "bg-blue-200 border-blue-400" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleCheck(i)}
              className={`${checks[i] ? item.activeColor : item.color} border-2 border-dashed p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden`}
            >
              <div className={`w-7 h-7 border-2 border-black rounded-lg flex items-center justify-center bg-white relative z-10`}>
                {checks[i] && (
                  <motion.div
                    initial={{ scale: 4, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="border-2 border-red-600 text-red-600 font-black text-[10px] px-0.5 rounded-sm rotate-[-15deg] bg-white/80">
                      불효
                    </div>
                  </motion.div>
                )}
              </div>
              <span className="text-lg font-bold text-slate-700 leading-tight relative z-10">
                {item.text}
              </span>
              
              {/* Large Stamp Overlay */}
              <AnimatePresence>
                {checks[i] && (
                  <motion.div
                    initial={{ scale: 5, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 0.2, rotate: -25 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <div className="border-4 border-red-600 text-red-600 font-black text-4xl px-4 py-1 rounded-xl uppercase tracking-widest">
                      불효
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Interaction Area */}
      <AnimatePresence mode="wait">
        {/* Input State */}
        {hasTriggeredInput && appState === 'input' && (
          <motion.section 
            key="input"
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-[#FFF9C4] cartoon-border p-6 rounded-3xl mb-8 text-center relative"
          >
            {/* Ticking Sound Simulation (Visual) */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute -top-4 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg rotate-12 shadow-lg"
            >
              째깍째깍!
            </motion.div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-bold text-slate-800">
                그럼, 부모님 주민번호 앞자리만 입력해 보세요!
              </p>
              <div className="bg-red-500 text-white font-black px-3 py-1 rounded-full text-xl cartoon-border shadow-none">
                {timer}s
              </div>
            </div>

            {timerMessage && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 font-bold mb-4 text-sm"
              >
                {timerMessage}
              </motion.p>
            )}
            
            <div className="mb-6">
              <input 
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="YYMMDD"
                className="w-full max-w-[220px] text-center text-3xl font-bold tracking-[0.2em] border-3 border-black rounded-2xl py-4 focus:ring-4 focus:ring-orange-300 outline-none placeholder:text-slate-300"
              />
            </div>
            
            <motion.button 
              whileHover={birthday.length === 6 ? { scale: 1.02 } : {}}
              whileTap={birthday.length === 6 ? { scale: 0.95 } : {}}
              onClick={calculateBirthday}
              disabled={birthday.length !== 6}
              className={`w-full font-black text-xl py-5 rounded-2xl cartoon-button flex items-center justify-center gap-2 transition-colors ${
                birthday.length === 6 
                  ? 'bg-[#FF6D00] text-white' 
                  : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              불효자 탈출하기! 🏃💨
            </motion.button>
          </motion.section>
        )}

        {/* Failure State */}
        {appState === 'failure' && (
          <motion.section 
            key="failure"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-[#1A237E] cartoon-border p-8 rounded-3xl mb-8 text-center text-white"
          >
            <h3 className="text-3xl font-black mb-4 text-red-500">판정 완료</h3>
            <p className="text-2xl font-bold mb-6">당신은 불효자입니다.</p>
            <div className="w-20 h-20 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-8">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleRetry}
                className="w-full bg-white text-[#1A237E] font-black py-4 rounded-xl cartoon-button text-sm"
              >
                다시 하기 (10초는 너무 짧아...)
              </button>
              <button 
                onClick={handleAskMom}
                className="w-full bg-transparent border-2 border-white text-white font-black py-4 rounded-xl cartoon-button text-sm shadow-none"
              >
                엄마/아빠한테 물어보고 올게요
              </button>
            </div>
          </motion.section>
        )}

        {/* Asking Mom State */}
        {appState === 'askingMom' && (
          <motion.section 
            key="askingMom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white cartoon-border p-8 rounded-3xl mb-8 text-center"
          >
            <div className="text-5xl mb-6">🤫</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 leading-relaxed">
              저는 비밀로 할게요.<br />
              얼른 엄마/아빠에게 안부 전화 겸<br />
              생일 여쭤보세요 ㅋㅋ
            </h3>
            <p className="text-slate-500 text-sm mb-8">
              전화 다 하셨나요? 이제 진짜 탈출해봅시다!
            </p>
            <button 
              onClick={handleRetry}
              className="w-full bg-orange-500 text-white font-black py-4 rounded-xl cartoon-button"
            >
              이제 알아요! 입력하러 가기
            </button>
          </motion.section>
        )}

        {/* Result State */}
        {appState === 'result' && result && (
          <motion.section 
            key="result"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white cartoon-border p-8 rounded-3xl text-center relative overflow-hidden mb-8"
          >
            <div className="absolute top-4 left-4 text-2xl">🎉</div>
            <div className="absolute top-12 right-6 text-2xl">✨</div>
            <div className="absolute bottom-6 left-10 text-2xl">🎈</div>
            
            <h3 className="font-gaegu text-3xl font-bold text-green-600 mb-6">
              불효자 탈출 성공! 👑
            </h3>
            
            <div className="bg-slate-50 border-2 border-black rounded-2xl py-6 mb-6 shadow-inner">
              <p className="text-slate-500 text-sm font-bold mb-2">올해 진짜 생신</p>
              <p className="text-5xl font-black text-[#FF6D00]">
                {result.month}월 {result.day}일({result.weekDay})
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-8">
              <p className="text-sm font-bold leading-relaxed text-slate-700">
                <AlertCircle size={16} className="inline mr-1 text-orange-500" />
                <span className="text-orange-600">주의!</span> 카톡 알림(<span className="line-through">{result.originalDate}</span>)에 속지 마세요.<br />
                진짜 생신은 <span className="underline decoration-orange-400 decoration-2 underline-offset-4">{result.month}월 {result.day}일</span>입니다!<br />
                꼭 기억해 두세요!
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button className="w-full bg-[#FEE500] text-black font-bold py-4 rounded-2xl cartoon-button text-sm flex items-center justify-center gap-2">
                <Share2 size={18} /> 카톡 공유
              </button>

              <div className="relative pt-4">
                <button 
                  onClick={handleOpenCertificateModal}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-5 rounded-2xl cartoon-button text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <Award size={24} /> 명예 효자 임명장 출력하기 (2,000원)
                </button>
                <p className="mt-3 text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                  <Heart size={12} className="text-red-500 fill-red-500" />
                  수익금의 일부는 홀로 계신 어르신들을 돕기 위해 사용됩니다.
                </p>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Certificate Multi-step Modal */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white cartoon-border w-full max-w-md overflow-hidden rounded-3xl relative"
            >
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600 bg-white/80 rounded-full p-1"
              >
                <X size={24} />
              </button>
              
              <div className="p-8">
                {modalStep === 'input' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award size={32} className="text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800">임명장 정보 입력</h3>
                      <p className="text-slate-500 text-sm mt-2">본인의 성함을 입력해주세요.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">본인 이름 (효자/효녀)</label>
                        <input 
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          placeholder="예: 홍길동"
                          className="w-full border-3 border-black rounded-xl py-4 px-4 text-lg font-bold focus:ring-4 focus:ring-orange-300 outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleGeneratePreviews}
                      className="w-full bg-orange-500 text-white font-black py-4 rounded-xl cartoon-button flex items-center justify-center gap-2"
                    >
                      샘플 미리보기 <ChevronRight size={20} />
                    </button>
                  </motion.div>
                )}

                {modalStep === 'preview' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-black text-slate-800">디자인 선택</h3>
                      <p className="text-slate-500 text-sm mt-1">마음에 드는 스타일을 골라보세요.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div 
                        onClick={() => handleSelectTemplate('traditional')}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-black overflow-hidden relative group-hover:ring-4 ring-orange-300 transition-all">
                          <img src={previews.traditional} alt="Traditional" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">선택</span>
                          </div>
                        </div>
                        <p className="text-center mt-2 font-bold text-xs">전통형</p>
                      </div>
                      <div 
                        onClick={() => handleSelectTemplate('modern')}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-black overflow-hidden relative group-hover:ring-4 ring-orange-300 transition-all">
                          <img src={previews.modern} alt="Modern" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">선택</span>
                          </div>
                        </div>
                        <p className="text-center mt-2 font-bold text-xs">모던형</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setModalStep('input')}
                      className="w-full text-slate-400 font-bold py-2 text-sm"
                    >
                      이름 수정하러 가기
                    </button>
                  </motion.div>
                )}

                {modalStep === 'payment' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CreditCard size={40} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4">최종 결제 및 발급</h3>
                    
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 font-bold">선택한 디자인</span>
                        <span className="font-black">{selectedTemplate === 'traditional' ? '전통형' : '모던형'}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-500 font-bold">발급 비용</span>
                        <span className="font-black text-orange-600">2,000원</span>
                      </div>
                      <div className="border-t border-slate-200 pt-4 text-left">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          * 결제 완료 시 워터마크가 제거된 고화질(A4 사이즈) 이미지가 즉시 다운로드됩니다.<br/>
                          * 수익금의 일부는 위원회 이름으로 홀로 계신 어르신들께 기부됩니다.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={handleFinalPayment}
                        className="w-full bg-orange-500 text-white font-black py-5 rounded-xl cartoon-button text-lg flex items-center justify-center gap-2"
                      >
                        명예 효자 임명장 다운로드하기
                      </button>
                      <button 
                        onClick={() => setModalStep('preview')}
                        className="w-full text-slate-400 font-bold py-2 text-sm"
                      >
                        디자인 다시 고르기
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-center text-slate-400 text-xs px-6">
        <p>© 2026 전국 불효자 방지 위원회. All rights reserved.</p>
        <p className="mt-2 italic">본 서비스는 불효자의 양심을 가책하기 위해 제작되었습니다.</p>
      </footer>
    </div>
  );
}
