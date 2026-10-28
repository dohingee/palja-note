# 팔자노트

iOS 사주팔자 앱. Expo(React Native) + EAS 클라우드 빌드. 기획은 `docs/SPEC.md`, Expo 작업 규칙은 `AGENTS.md`를 따른다.

- 부품은 셋이고 계약 파일로만 주고받는다: 계산 엔진 `src/saju/api.ts`·`types.ts`, 풀이 문구 `src/content/api.ts`, 기기 안 AI `src/ai/api.ts`. 계약을 바꾸면 쓰는 쪽을 함께 고친다.
- 점수 가중치는 `src/saju/engine/fortune.ts`의 `SCORING` 표 한 곳, 광고 ID·규칙은 `src/lib/adConfig.ts` 한 곳에서만 바꾼다.
- 이 클라우드 환경에서는 api.expo.dev가 막혀 있어 `EXPO_OFFLINE=1 npx expo install <패키지>`로 설치한다.
- 끝내기 전에 `npx tsc --noEmit`와 `npm test`를 통과시킨다.
