/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Share2, AlertCircle, Sparkles, Heart, Award, Download, X, ChevronRight, CreditCard, Play } from 'lucide-react';
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
  const [checks, setChecks] = useState([false, false, false, false, false, false]);
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
  const [certificateLoading, setCertificateLoading] = useState(false);

  // 랜딩(카카오톡 재생 버튼) → 인트로 스토리 → 메인
  const [showLanding, setShowLanding] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [introMessageIndex, setIntroMessageIndex] = useState(0);
  const cameFromLandingRef = useRef(false);
  const [showReplaySubText, setShowReplaySubText] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.35);
  const checklistRef = useRef<HTMLElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const kakaotalkRef = useRef<HTMLAudioElement>(null);

  // SFX: 공개 URL 소스 (테스트·배포에서 재생 보장)
  const SFX_SOURCES = {
    click: 'https://t1.daumcdn.net/kakaotv/resource/pw/sfx/click.mp3',
    transition: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    success: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    alert: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  } as const;
  const sfxClickRef = useRef<HTMLAudioElement | null>(null);
  const sfxTransitionRef = useRef<HTMLAudioElement | null>(null);
  const sfxSuccessRef = useRef<HTMLAudioElement | null>(null);
  const sfxAlertRef = useRef<HTMLAudioElement | null>(null);
  const [sfxMuted, setSfxMuted] = useState(false);
  const sfxUnlockedRef = useRef(false);
  const prevAppStateRef = useRef(appState);

  // SFX Preload: 공개 URL로 로드
  useEffect(() => {
    const keys = ['click', 'transition', 'success', 'alert'] as const;
    const refs = [sfxClickRef, sfxTransitionRef, sfxSuccessRef, sfxAlertRef];
    keys.forEach((key, i) => {
      const a = new Audio(SFX_SOURCES[key]);
      a.preload = 'auto';
      a.load();
      (refs[i] as React.MutableRefObject<HTMLAudioElement | null>).current = a;
    });
  }, []);

  // 첫 클릭/터치 시 오디오 잠금 해제 + 즉시 클릭음 재생 (브라우저 정책: 같은 타이밍에 소리 나야 함)
  useEffect(() => {
    const unlock = () => {
      sfxUnlockedRef.current = true;
      const el = sfxClickRef.current;
      if (el) {
        el.volume = 0.5;
        el.currentTime = 0;
        el.play().catch(() => {});
      }
    };
    document.addEventListener('click', unlock, { once: true, capture: true });
    document.addEventListener('touchstart', unlock, { once: true, capture: true });
    return () => {
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
    };
  }, []);

  const playSfx = useCallback((ref: React.RefObject<HTMLAudioElement | null>, volume = 0.5) => {
    if (sfxMuted || !sfxUnlockedRef.current) return;
    const el = ref.current;
    if (!el) return;
    el.volume = volume;
    el.currentTime = 0;
    el.play().catch(() => {});
  }, [sfxMuted]);
  const playClickSound = useCallback(() => playSfx(sfxClickRef, 0.6), [playSfx]);
  const playTransitionSound = useCallback(() => playSfx(sfxTransitionRef, 0.4), [playSfx]);
  const playSuccessSound = useCallback(() => playSfx(sfxSuccessRef, 0.6), [playSfx]);
  const playAlertSound = useCallback(() => playSfx(sfxAlertRef, 0.5), [playSfx]);

  const INTRO_MESSAGES = [
    "분명 카톡에선 오늘이 생신이라는데... '그건 양력이다 얘야'라는 어머니의 호통에 당황하셨나요?",
    "윤달, 음력 계산기... 부모님 생신 챙기기, 수능 수학보다 더 어렵게 느껴질 때가 있죠?",
    "생신 당일 아침, 미역국 사진만 단톡방에 올리고 식은땀 흘려본 적 있으신가요?",
    "이제 더 이상 헷갈리지 마세요. 진짜 효도는 '정확한 날짜'부터 시작됩니다.",
  ];

  // 인트로 문구 타이밍: 인트로 화면이 보일 때만 6초 후 다음 문구로 (랜딩에서는 타이머 미동작)
  const introNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!showIntro || showLanding) return;
    if (introMessageIndex >= INTRO_MESSAGES.length) return;
    const t1 = setTimeout(() => {
      introNextTimerRef.current = setTimeout(() => setIntroMessageIndex((i) => i + 1), 500);
    }, 6000);
    return () => {
      clearTimeout(t1);
      if (introNextTimerRef.current) clearTimeout(introNextTimerRef.current);
    };
  }, [showIntro, showLanding, introMessageIndex, INTRO_MESSAGES.length]);

  const introDone = introMessageIndex >= INTRO_MESSAGES.length;

  // 인트로 진입 시 BGM 자동 재생 (랜딩이 끝난 뒤에만)
  useEffect(() => {
    if (!showIntro || showLanding) return;
    const audio = bgmRef.current;
    if (!audio) return;
    audio.volume = bgmVolume;
    const play = () => audio.play().then(() => setIsBgmPlaying(true)).catch(() => {});
    play();
    return () => {
      audio.pause();
      setIsBgmPlaying(false);
    };
  }, [showIntro, showLanding]);

  // BGM 볼륨 슬라이더와 오디오 엘리먼트 항상 동기화 (조절이 반영되도록)
  useEffect(() => {
    const audio = bgmRef.current;
    if (audio) audio.volume = bgmVolume;
  }, [bgmVolume]);

  const handleIntroButtonClick = () => {
    sfxUnlockedRef.current = true; // 버튼 클릭 시점에 먼저 잠금 해제 (그 다음 playClickSound 재생)
    playClickSound();
    bgmRef.current?.pause();
    setIsBgmPlaying(false);
    setShowIntro(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleReplayIntro = () => {
    playTransitionSound(); // 종이 넘기는 느낌의 효과음
    setShowReplaySubText(true);
    setTimeout(() => setShowReplaySubText(false), 600);
    setIntroMessageIndex(0); // 첫 번째 문구부터 다시 재생
  };

  const toggleBgm = () => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (isBgmPlaying) {
      audio.pause();
      setIsBgmPlaying(false);
    } else {
      audio.volume = bgmVolume;
      audio.play().then(() => setIsBgmPlaying(true)).catch(() => {});
    }
  };

  // 첫 터치/클릭 시 BGM + SFX 오디오 잠금 해제 (브라우저 정책)
  const tryBgmOnFirstInteraction = () => {
    sfxUnlockedRef.current = true;
    if (isBgmPlaying || !bgmRef.current) return;
    bgmRef.current.volume = bgmVolume;
    bgmRef.current.play().then(() => setIsBgmPlaying(true)).catch(() => {});
  };

  // 인트로: 첫 문구 시 카카오톡 알림음 (랜딩에서 이미 재생했으면 스킵)
  useEffect(() => {
    if (!showIntro || introMessageIndex !== 0) return;
    if (cameFromLandingRef.current) {
      cameFromLandingRef.current = false;
      return;
    }
    const audio = kakaotalkRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [showIntro, introMessageIndex]);

  // 카카오톡 사운드 프리로드 (랜딩 버튼 클릭 시 지연 없이 재생)
  useEffect(() => {
    const audio = kakaotalkRef.current;
    if (audio) {
      audio.preload = 'auto';
      audio.load();
    }
  }, []);

  // 랜딩: 재생 버튼 클릭 → 카카오톡 음 재생 + 전체 오디오 잠금 해제 → 종료 시 페이드아웃 후 인트로
  const handleLandingPlay = useCallback(() => {
    sfxUnlockedRef.current = true;
    const kakaotalk = kakaotalkRef.current;
    const bgm = bgmRef.current;
    const sfxRefs = [sfxClickRef, sfxTransitionRef, sfxSuccessRef, sfxAlertRef];

    // BGM·SFX 한 번씩 play → pause 로 브라우저 오디오 정책 해제
    if (bgm) {
      bgm.volume = bgmVolume;
      bgm.play().then(() => bgm.pause()).catch(() => {});
    }
    sfxRefs.forEach((ref) => {
      const el = ref.current;
      if (el) {
        el.volume = 0.3;
        el.play().then(() => el.pause()).catch(() => {});
      }
    });

    // 카카오톡 알림음 1회 재생 (모바일에서 과하게 크지 않도록 0.5) → 종료 시 곧바로 인트로로 전환
    if (kakaotalk) {
      kakaotalk.volume = 0.5;
      kakaotalk.currentTime = 0;
      const goToIntro = () => {
        cameFromLandingRef.current = true;
        setShowLanding(false);
      };
      const onEnded = () => {
        kakaotalk.removeEventListener('ended', onEnded);
        playTransitionSound();
        goToIntro();
      };
      kakaotalk.addEventListener('ended', onEnded);
      kakaotalk.play().catch(() => {
        kakaotalk.removeEventListener('ended', onEnded);
        goToIntro();
      });
    } else {
      cameFromLandingRef.current = true;
      setShowLanding(false);
    }
  }, [bgmVolume, playTransitionSound]);

  // 불효자 경보 시 경고음 (한 번만)
  useEffect(() => {
    if (appState === 'failure' && prevAppStateRef.current !== 'failure') {
      prevAppStateRef.current = 'failure';
      playAlertSound();
    } else if (appState !== 'failure') {
      prevAppStateRef.current = appState;
    }
  }, [appState, playAlertSound]);

  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setBgmVolume(v);
  };

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
      if (checkedCount >= 5) {
        setTimerMessage('불효 지수 폭발 직전! 10초 안에 입력해서 명예 회복하세요!');
      } else if (checkedCount === 4) {
        setTimerMessage('위험한 수준! 지금 바로 생일 입력해서 증명하세요!');
      } else if (checkedCount === 3) {
        setTimerMessage('완벽한 불효자 후보시군요. 10초 드립니다. 실시!');
      } else if (checkedCount === 2) {
        setTimerMessage('불효 지수 위험! 지금 당장 입력해서 증명하세요!');
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
    setCertificateLoading(true);
    const traditionalPreview = generateCertificateDataUrl('traditional', true);
    const modernPreview = generateCertificateDataUrl('modern', true);
    
    Promise.all([traditionalPreview, modernPreview])
      .then(([trad, mod]) => {
        console.log('Previews generated:', { trad: !!trad, mod: !!mod });
        setPreviews({
          traditional: trad || '',
          modern: mod || ''
        });
        setModalStep('preview');
      })
      .catch(() => setCertificateLoading(false))
      .finally(() => setCertificateLoading(false));
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
      playSuccessSound();
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

    // 샘플 미리보기에서는 이름 마지막 한 글자를 *로 마스킹 (예: 이동훈 → 이동*)
    const displayName = isPreview && childName.length > 0 ? childName.slice(0, -1) + '*' : childName;

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
          
          ctx.fillText(displayName, nameX, nameY);

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

          // 샘플 미리보기: SAMPLE 빨간색 스탬프 워터마크 (45도 기울임)
          if (isPreview) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.font = 'bold 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
            ctx.strokeStyle = 'rgba(185, 28, 28, 0.6)';
            ctx.lineWidth = 3;
            ctx.strokeText('SAMPLE', 0, 0);
            ctx.fillText('SAMPLE', 0, 0);
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
            // 전통형과 동일하게 Hahmlet 폰트 사용
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

          // Synthesis Text: Name (전통형과 동일 폰트)
          ctx.fillStyle = '#111111';
          ctx.font = 'bold 42px "Hahmlet"';
          ctx.textAlign = 'center';
          
          const nameX = canvas.width * 0.5; 
          const nameY = canvas.height * 0.34; 
          
          ctx.fillText(displayName, nameX, nameY);

          // Synthesis Text: Date (전통형과 동일한 시스템 일자 형식)
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          
          ctx.font = 'bold 34px "Hahmlet"';
          ctx.fillStyle = '#111111';
          ctx.textAlign = 'center';
          const dateX = canvas.width * 0.5;
          const dateY = canvas.height * 0.92;
          
          ctx.fillText(`${year}년 ${month}월 ${day}일`, dateX, dateY);

          // 샘플 미리보기: SAMPLE 빨간색 스탬프 워터마크 (45도 기울임)
          if (isPreview) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.font = 'bold 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
            ctx.strokeStyle = 'rgba(185, 28, 28, 0.6)';
            ctx.lineWidth = 3;
            ctx.strokeText('SAMPLE', 0, 0);
            ctx.fillText('SAMPLE', 0, 0);
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

    // 샘플 미리보기: SAMPLE 빨간색 스탬프 워터마크 (45도 기울임)
    if (isPreview) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText('SAMPLE', 0, 0);
      ctx.fillText('SAMPLE', 0, 0);
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  };

  return (
    <div className="min-h-screen font-sans pb-20 px-4 max-w-md mx-auto">
      {/* 전역 SFX 음소거 버튼 (화면 구석) — 첫 클릭 후 효과음 재생 가능 */}
      <button
        type="button"
        onClick={() => setSfxMuted((m) => !m)}
        className="fixed bottom-4 right-4 z-[90] flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white/95 text-lg shadow-md transition hover:border-orange-300 hover:bg-orange-50"
        aria-label={sfxMuted ? '효과음 켜기' : '효과음 끄기'}
        title={sfxMuted ? '효과음 켜기' : '효과음 끄기'}
      >
        {sfxMuted ? '🔊' : '🔇'}
      </button>

      {/* 랜딩(카카오톡 재생 버튼) 또는 공감 인트로 */}
      {(showLanding || showIntro) ? (
        <>
          <audio ref={bgmRef} src="/bgm.mp3" loop playsInline />
          <audio ref={kakaotalkRef} src="/assets/sounds/kakaotalk.mp3" preload="auto" playsInline />
          {showLanding ? (
            <section
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center min-h-screen px-8 py-16"
              style={{ backgroundColor: '#fcfaf5' }}
              aria-label="음성 메시지"
            >
              <p className="absolute top-[18%] left-1/2 -translate-x-1/2 w-full max-w-sm font-gaegu text-base sm:text-lg text-slate-500 text-center tracking-tight">
                부모님께서 음성 메시지를 보내셨습니다.
              </p>
              <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                <button
                  type="button"
                  onClick={handleLandingPlay}
                  className="landing-play-pulse focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 rounded-full flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/90 border border-slate-200 rounded-full shadow-sm text-slate-600 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all"
                  aria-label="음성 메시지 재생"
                >
                  <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-0.5" strokeWidth={2} />
                </button>
              </div>
            </section>
          ) : (
        <section
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-8 bg-[#fcfaf5]"
          style={{ backgroundColor: '#fcfaf5' }}
          aria-label="공감 인트로"
          onPointerDown={tryBgmOnFirstInteraction}
          onClick={tryBgmOnFirstInteraction}
        >
          <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white/90 px-2 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleBgm(); }}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-bold text-slate-600 transition hover:text-orange-600"
                aria-label={isBgmPlaying ? 'BGM 끄기' : 'BGM 켜기'}
              >
                {isBgmPlaying ? '🔇 끄기' : '🔊 켜기'}
              </button>
              <span className="text-slate-400">|</span>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span className="sr-only">BGM 볼륨</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={bgmVolume}
                  onChange={handleBgmVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="h-2 w-24 sm:w-28 accent-orange-500 cursor-pointer"
                  aria-label="BGM 볼륨 조절"
                />
                <span className="min-w-[2rem] text-slate-500 tabular-nums">
                  {Math.round(bgmVolume * 100)}%
                </span>
              </label>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center w-full max-w-md mx-auto text-center min-h-0">
            {!introDone && INTRO_MESSAGES[introMessageIndex] != null && (
              <p
                key={introMessageIndex}
                className="intro-message text-lg sm:text-xl font-bold text-slate-700 leading-relaxed"
              >
                {INTRO_MESSAGES[introMessageIndex]}
              </p>
            )}
            {introDone && (
              <div className="intro-button-enter relative flex flex-col items-center gap-3 w-full max-w-sm">
                <p className="text-center text-sm font-bold text-amber-800/90 drop-shadow-sm mb-1">
                  ⚠️ 주의: 당신의 등 뒤가 서늘해질 수 있습니다
                </p>
                <button
                  type="button"
                  onClick={handleIntroButtonClick}
                  className="w-full bg-[#E65100] hover:bg-[#F57C00] text-white font-black py-5 px-6 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-base sm:text-lg"
                >
                  🚨 지금 바로 나의 효자 지수 체크하기
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sfxUnlockedRef.current = true;
                    playClickSound();
                  }}
                  className="text-xs text-slate-500 hover:text-orange-500 font-medium"
                >
                  🔊 소리 테스트
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleReplayIntro(); }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
                >
                  방금 나온 불효 경보 다시 보기
                </button>
                <AnimatePresence>
                  {showReplaySubText && (
                    <motion.p
                      key="replay-sub"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-1/4 left-0 right-0 text-center text-xs font-gaegu text-slate-500 italic"
                    >
                      맞아, 이거 네 얘기야...
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <p className="absolute bottom-6 left-0 right-0 text-center text-sm text-slate-500">
            🔊 소리와 함께 즐기려면 화면을 클릭하세요
          </p>
        </section>
          )}
        </>
      ) : null}

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
        
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          전국 불효자 방지 위원회
        </p>
        <h1 className="font-gaegu text-2xl sm:text-3xl font-bold text-[#E65100] mb-2 tracking-tight leading-tight">
          카톡 생일 알림에 속지 마세요.
        </h1>
        <p className="text-base font-bold text-slate-600 mb-2">
          아버지가 &apos;나 오늘 생일 아니다&apos;라고 말씀하시기 전에.
        </p>
        <div className="inline-block bg-amber-50 border-2 border-black rounded-full px-4 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-slate-700">
            AI도 울고 가는 부모님 진짜 생일 계산기
          </p>
        </div>
      </header>

      {/* Checklist Section */}
      <section ref={checklistRef} id="check-section" className="bg-white cartoon-border p-6 rounded-3xl mb-8 scroll-mt-4">
        <h2 className="font-gaegu text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-3xl">📝</span> 불효 지수 테스트
        </h2>
        <p className="text-sm text-slate-500 mb-4">해당하는 걸 눌러보세요. 2개 이상이면 생일 입력이 열려요.</p>
        <div className="space-y-4">
          {[
            { text: "부모님 생신 까먹은 적 있음?", color: "bg-orange-50 border-orange-200", activeColor: "bg-orange-200 border-orange-400" },
            { text: "카톡 알림 보고 전화했다가 \"오늘 아니다\" 소리 들었다", color: "bg-green-50 border-green-200", activeColor: "bg-green-200 border-green-400" },
            { text: "아직도 난 부모님 주민번호를 모른다", color: "bg-blue-50 border-blue-200", activeColor: "bg-blue-200 border-blue-400" },
            { text: "부모님 음력 생일, 지금도 헷갈린다", color: "bg-amber-50 border-amber-200", activeColor: "bg-amber-200 border-amber-400" },
            { text: "카톡 가짜 알림 때문에 어색한 전화해 봄?", color: "bg-rose-50 border-rose-200", activeColor: "bg-rose-200 border-rose-400" },
            { text: "용돈 드릴 때 손이 떨린 적 있음?", color: "bg-sky-50 border-sky-200", activeColor: "bg-sky-200 border-sky-400" }
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
              className={`btn w-full font-black text-xl py-5 rounded-2xl cartoon-button gap-2 transition-colors ${
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
                className="btn w-full bg-white text-[#1A237E] font-black py-4 rounded-xl cartoon-button text-sm"
              >
                다시 하기 (10초는 너무 짧아...)
              </button>
              <button 
                onClick={handleAskMom}
                className="btn w-full bg-transparent border-2 border-white text-white font-black py-4 rounded-xl cartoon-button text-sm shadow-none"
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
              className="btn w-full bg-orange-500 text-white font-black py-4 rounded-xl cartoon-button"
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
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-8 text-center">
              <p className="text-sm font-bold leading-relaxed text-slate-700 break-keep">
                <AlertCircle size={16} className="inline mr-1 text-orange-500" />
                <span className="text-orange-600">주의!</span> 카톡 알림(<span className="line-through">{result.originalDate}</span>)에 속지 마세요.<br />
                진짜 생신은 <span className="underline decoration-orange-400 decoration-2 underline-offset-4">{result.month}월 {result.day}일</span>입니다!<br />
                꼭 기억해 두세요!
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button className="btn w-full bg-[#FEE500] text-black font-bold py-4 rounded-2xl cartoon-button text-sm gap-2">
                <Share2 size={18} className="shrink-0" /> <span className="text-center">카톡 공유</span>
              </button>

              <div className="relative pt-4">
                <p className="font-gaegu text-sm sm:text-base text-slate-500 text-center mb-2 break-keep intro-disclaimer">
                  이건 굳이 안 하셔도 되는데 굳이 효자 임명장 필요하신 찐 효자 분들만...ㅋㅋ
                </p>
                <button 
                  onClick={handleOpenCertificateModal}
                  className="btn w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-5 px-4 rounded-2xl cartoon-button text-base sm:text-lg gap-2 shadow-lg leading-snug text-center"
                >
                  <Award size={24} className="shrink-0" /> <span>명예 효자 임명장 출력하기 (2,000원)</span>
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
                {certificateLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 gap-6"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-orange-200 rounded-full" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-lg font-bold text-slate-700 text-center">
                      고화질 임명장 로딩중 ...
                    </p>
                  </motion.div>
                ) : modalStep === 'input' ? (
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
                      className="btn w-full bg-orange-500 text-white font-black py-4 rounded-xl cartoon-button gap-2"
                    >
                      샘플 미리보기 <ChevronRight size={20} />
                    </button>
                  </motion.div>
                ) : modalStep === 'preview' ? (
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
                ) : modalStep === 'payment' ? (
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
                        className="btn w-full bg-orange-500 text-white font-black py-5 rounded-xl cartoon-button text-lg gap-2"
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
                ) : null}
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
