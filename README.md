<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 전국 불효자 방지 위원회 · 부모님 진짜 생일 계산기

카톡 생일 알림에 속지 마세요. AI도 울고 가는 부모님 진짜 생일(음력) 계산기 웹앱입니다.

View your app in AI Studio: https://ai.studio/apps/00421cb5-95d7-4edf-9b4f-cb5a27c17ec7

## 기능 구현 현황

| 구분 | 기능 | 상태 |
|------|------|------|
| **시작 화면** | 한지 배경 + "부모님께서 음성 메시지를 보내셨습니다." 문구 | ✅ |
| | 삼각형 재생 버튼(펄싱 애니메이션), 클릭 시 카톡 알림음 + 오디오 잠금 해제 | ✅ |
| | 소리 종료 시 곧바로 인트로 스토리로 전환, 첫 문구 페이드 인 | ✅ |
| **인트로** | 공감 문구 4단계 (6초 표시 후 0.5초 딜레이로 다음 문구) | ✅ |
| | BGM(가야금 등) 재생/일시정지·볼륨, 인트로에서만 타이머 동작 | ✅ |
| | CTA "지금 바로 나의 효자 지수 체크하기" → 메인으로 스크롤 | ✅ |
| | "다시 보기"로 인트로 재생, 소리 테스트 버튼 | ✅ |
| **메인** | 불효 지수 체크리스트(6항목), 체크 수에 따른 타이머 메시지 | ✅ |
| | 생일 입력 → 음력 변환(솔라루나), 결과 표시 / "엄마한테 물어보기" 플로우 | ✅ |
| **임명장** | 전통형·현대형 템플릿, 샘플 미리보기(로딩 스피너, SAMPLE 워터마크) | ✅ |
| | 인쇄·다운로드, 결제 플로우(테스트) | ✅ |
| **소리** | BGM: `public/bgm.mp3`, 카톡 알림: `public/assets/sounds/kakaotalk.mp3` (볼륨 0.5) | ✅ |
| | SFX(클릭/전환/성공/경고), 전역 음소거, 첫 터치 시 오디오 잠금 해제 | ✅ |
| **배포** | Vercel 프로덕션 배포 (`npm run build && npx vercel --prod --yes`) | ✅ |

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 소리 (BGM / 효과음)

### BGM
인트로 화면 BGM을 쓰려면 **반드시** `public/bgm.mp3` 파일을 추가해야 합니다.  
(파일이 없으면 /bgm.mp3 요청이 404가 나며, 인트로 우측 상단 BGM 컨트롤만 보이고 소리는 나지 않습니다.)  
가야금 등 잔잔한 음원을 mp3로 저장한 뒤 `public/bgm.mp3`로 넣으면 됩니다.

### 효과음이 안 날 때
1. **화면을 한 번 터치/클릭**한 뒤에만 소리가 납니다 (브라우저 정책).
2. 배포 사이트에서 외부 소스가 막히면: `public/sfx/` 폴더에 [sfx/README.md](public/sfx/README.md) 안내대로 ogg 파일을 넣으면 같은 도메인으로 재생됩니다.
