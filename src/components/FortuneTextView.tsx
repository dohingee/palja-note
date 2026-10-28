// 풀이 문구(제목·본문·조언)를 보여준다.
// 기기 안 AI를 쓸 수 있으면 원래 문구를 먼저 보여 주고, 맞춤 문장이 준비되면 바꿔 끼운다("AI 맞춤 풀이" 배지).
// AI가 안 되거나 실패하면 원래 문구를 그대로 둔다.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { isAvailable, rewriteFortune } from '../ai/api';
import type { FortuneText } from '../content/api';
import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';
import { Badge } from './ui';

type AiState = { status: 'off' } | { status: 'loading' } | { status: 'done'; text: FortuneText } | { status: 'failed' };

const useStyles = createStyles((t) =>
  StyleSheet.create({
    wrap: { gap: spacing.md },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 22 },
    loadingText: { fontSize: font.caption, color: t.colors.textMuted },
    headline: { fontSize: font.heading, fontWeight: '800', color: t.colors.text, lineHeight: 30 },
    body: { fontSize: font.bodyLarge, color: t.colors.text, lineHeight: 27 },
    adviceBox: {
      backgroundColor: t.colors.accentSoft,
      borderRadius: radius.md,
      padding: spacing.lg,
      gap: 4,
    },
    adviceLabel: { fontSize: font.caption, color: t.colors.accent, fontWeight: '800' },
    advice: { fontSize: font.body, color: t.colors.text, lineHeight: 22 },
    toggle: { alignSelf: 'flex-start', paddingVertical: 4 },
    toggleText: { fontSize: font.small, color: t.colors.textMuted, textDecorationLine: 'underline' },
  }),
);

interface Props {
  original: FortuneText;
  name: string;
  periodLabel: string;
  categoryLabel: string;
}

export function FortuneTextView(props: Props) {
  // 내용이 바뀌면 새로 그려서(AI 상태 초기화) 다시 시도한다. 같은 내용을 새 객체로 넘겨도 다시 부르지 않는다.
  const { original, name, periodLabel, categoryLabel } = props;
  const key = [original.headline, original.body, original.advice, name, periodLabel, categoryLabel].join('\n');
  return <FortuneTextInner key={key} {...props} />;
}

function FortuneTextInner({ original, name, periodLabel, categoryLabel }: Props) {
  const s = useStyles();
  const t = useTheme();
  const [ai, setAi] = useState<AiState>({ status: 'off' });
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!(await isAvailable())) return;
      if (!alive) return;
      setAi({ status: 'loading' });
      const text = await rewriteFortune({ name, periodLabel, categoryLabel, original });
      if (!alive) return;
      setAi(text ? { status: 'done', text } : { status: 'failed' });
    })().catch(() => {
      if (alive) setAi({ status: 'failed' });
    });
    return () => {
      alive = false;
    };
    // 처음 그릴 때 한 번만 실행한다(내용이 바뀌면 바깥 key가 바뀌어 새로 그려진다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usingAi = ai.status === 'done' && !showOriginal;
  const text = usingAi && ai.status === 'done' ? ai.text : original;

  return (
    <View style={s.wrap}>
      <View style={s.metaRow}>
        {usingAi ? <Badge label="AI 맞춤 풀이" /> : null}
        {ai.status === 'loading' ? (
          <>
            <ActivityIndicator size="small" color={t.colors.textMuted} />
            <Text style={s.loadingText}>{name}님에게 맞춘 풀이를 쓰고 있어요…</Text>
          </>
        ) : null}
      </View>
      <Text style={s.headline}>{text.headline}</Text>
      <Text style={s.body}>{text.body}</Text>
      <View style={s.adviceBox}>
        <Text style={s.adviceLabel}>한마디 조언</Text>
        <Text style={s.advice}>{text.advice}</Text>
      </View>
      {ai.status === 'done' ? (
        <Pressable style={s.toggle} onPress={() => setShowOriginal((v) => !v)} accessibilityRole="button">
          <Text style={s.toggleText}>{showOriginal ? 'AI 맞춤 풀이 보기' : '원래 풀이 보기'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
