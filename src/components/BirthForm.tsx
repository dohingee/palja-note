// 가입(첫 실행)과 설정의 "내 정보 수정"이 함께 쓰는 입력 양식.
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { computeChart } from '../saju/api';
import type { BirthInput, CalendarType, Gender } from '../saju/types';
import { emptyDraft, NAME_MAX_LENGTH, validateDraft } from '../lib/profile';
import type { DraftErrors, ProfileDraft } from '../lib/profile';
import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';
import { Button, Segmented } from './ui';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    form: { gap: spacing.xl },
    field: { gap: spacing.sm },
    label: { fontSize: font.body, fontWeight: '700', color: t.colors.text },
    hint: { fontSize: font.caption, color: t.colors.textMuted, lineHeight: 17 },
    error: { fontSize: font.small, color: t.colors.danger, fontWeight: '600' },
    input: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      fontSize: font.bodyLarge,
      color: t.colors.text,
    },
    inputError: { borderColor: t.colors.danger },
    dateRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    dateInput: { flex: 1, textAlign: 'center' },
    yearInput: { flex: 1.5, textAlign: 'center' },
    unit: { fontSize: font.body, color: t.colors.textMuted, fontWeight: '600' },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
    },
    toggleText: { fontSize: font.body, color: t.colors.text, fontWeight: '600' },
    checkbox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
    box: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    check: { fontSize: 13, fontWeight: '900', color: t.colors.onPrimary },
    pickerWrap: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
      alignItems: 'center',
    },
    timeButton: { paddingVertical: 14, alignItems: 'center' },
    timeButtonText: { fontSize: font.bodyLarge, color: t.colors.text, fontWeight: '700' },
    genderRow: { flexDirection: 'row', gap: spacing.sm },
    genderItem: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1.5,
      paddingVertical: 14,
      alignItems: 'center',
    },
    genderText: { fontSize: font.bodyLarge, fontWeight: '700' },
    formError: {
      fontSize: font.small,
      color: t.colors.danger,
      textAlign: 'center',
      lineHeight: 19,
    },
  }),
);

function timeLabel(h: number, m: number): string {
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}시 ${String(m).padStart(2, '0')}분`;
}

function Checkbox({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <Pressable
      style={s.checkbox}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
    >
      <View
        style={[
          s.box,
          { borderColor: checked ? t.colors.primary : t.colors.textFaint, backgroundColor: checked ? t.colors.primary : 'transparent' },
        ]}
      >
        {checked ? <Text style={s.check}>✓</Text> : null}
      </View>
      <Text style={s.toggleText}>{label}</Text>
    </Pressable>
  );
}

export function BirthForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ProfileDraft;
  submitLabel: string;
  onSubmit: (value: BirthInput) => Promise<void> | void;
}) {
  const s = useStyles();
  const t = useTheme();
  const [draft, setDraft] = useState<ProfileDraft>(initial ?? emptyDraft());
  const [errors, setErrors] = useState<DraftErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

  const timeValue = new Date(2000, 0, 1, draft.hour, draft.minute);
  const onTime = (_e: unknown, date: Date) => {
    setDraft((d) => ({ ...d, hour: date.getHours(), minute: date.getMinutes() }));
    setAndroidPickerOpen(false);
  };

  const submit = async () => {
    setFormError(null);
    const result = validateDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    // 음력 날짜가 실제로 있는지(그해 윤달 여부 등)는 엔진으로 한 번 계산해 확인한다.
    try {
      computeChart(result.value);
    } catch (e) {
      // 엔진은 "1985년 음력 4월은 29일까지입니다"처럼 이유를 알려 준다
      const reason = e instanceof Error && /[가-힣]/.test(e.message) ? ` (${e.message})` : '';
      setErrors({
        date:
          result.value.calendar === 'lunar'
            ? `음력 날짜나 윤달 여부를 다시 확인해 주세요.${reason}`
            : `이 날짜로는 계산할 수 없어요. 다시 확인해 주세요.${reason}`,
      });
      return;
    }
    try {
      setSaving(true);
      await onSubmit(result.value);
    } catch {
      setFormError('저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const genderOption = (g: Gender, label: string) => {
    const active = draft.gender === g;
    return (
      <Pressable
        key={g}
        onPress={() => set('gender', g)}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        style={[
          s.genderItem,
          {
            borderColor: active ? t.colors.primary : t.colors.border,
            backgroundColor: active ? t.colors.primarySoft : t.colors.surface,
          },
        ]}
      >
        <Text style={[s.genderText, { color: active ? t.colors.primary : t.colors.textMuted }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={s.form}>
      <View style={s.field}>
        <Text style={s.label}>이름 또는 별명</Text>
        <TextInput
          value={draft.name}
          onChangeText={(v) => set('name', v)}
          placeholder="예: 하늘"
          placeholderTextColor={t.colors.textFaint}
          maxLength={NAME_MAX_LENGTH + 4}
          style={[s.input, errors.name ? s.inputError : null]}
          returnKeyType="done"
          autoCorrect={false}
          accessibilityLabel="이름 또는 별명"
        />
        {errors.name ? <Text style={s.error}>{errors.name}</Text> : <Text style={s.hint}>풀이에서 이 이름으로 불러 드려요.</Text>}
      </View>

      <View style={s.field}>
        <Text style={s.label}>생년월일</Text>
        <Segmented<CalendarType>
          options={[
            { value: 'solar', label: '양력' },
            { value: 'lunar', label: '음력' },
          ]}
          value={draft.calendar}
          onChange={(v) => setDraft((d) => ({ ...d, calendar: v, isLeapMonth: v === 'lunar' ? d.isLeapMonth : false }))}
        />
        <View style={s.dateRow}>
          <TextInput
            value={draft.year}
            onChangeText={(v) => set('year', digits(v, 4))}
            placeholder="1990"
            placeholderTextColor={t.colors.textFaint}
            keyboardType="number-pad"
            style={[s.input, s.yearInput, errors.date ? s.inputError : null]}
            accessibilityLabel="태어난 해"
          />
          <Text style={s.unit}>년</Text>
          <TextInput
            value={draft.month}
            onChangeText={(v) => set('month', digits(v, 2))}
            placeholder="1"
            placeholderTextColor={t.colors.textFaint}
            keyboardType="number-pad"
            style={[s.input, s.dateInput, errors.date ? s.inputError : null]}
            accessibilityLabel="태어난 달"
          />
          <Text style={s.unit}>월</Text>
          <TextInput
            value={draft.day}
            onChangeText={(v) => set('day', digits(v, 2))}
            placeholder="1"
            placeholderTextColor={t.colors.textFaint}
            keyboardType="number-pad"
            style={[s.input, s.dateInput, errors.date ? s.inputError : null]}
            accessibilityLabel="태어난 날"
          />
          <Text style={s.unit}>일</Text>
        </View>
        {draft.calendar === 'lunar' ? (
          <Checkbox checked={draft.isLeapMonth} label="윤달이에요" onToggle={() => set('isLeapMonth', !draft.isLeapMonth)} />
        ) : null}
        {errors.date ? <Text style={s.error}>{errors.date}</Text> : null}
      </View>

      <View style={s.field}>
        <Text style={s.label}>태어난 시각</Text>
        <View style={s.toggleRow}>
          <Text style={s.toggleText}>시각을 몰라요</Text>
          <Switch
            value={draft.hourUnknown}
            onValueChange={(v) => set('hourUnknown', v)}
            trackColor={{ true: t.colors.primary, false: t.colors.border }}
            accessibilityLabel="출생 시각 모름"
          />
        </View>
        {draft.hourUnknown ? (
          <Text style={s.hint}>시각을 모르면 시주를 빼고 년·월·일 세 기둥(삼주)으로 풀어요.</Text>
        ) : Platform.OS === 'ios' ? (
          <View style={s.pickerWrap}>
            <DateTimePicker
              value={timeValue}
              mode="time"
              display="spinner"
              locale="ko-KR"
              minuteInterval={1}
              themeVariant={t.scheme}
              textColor={t.colors.text}
              onValueChange={onTime}
            />
          </View>
        ) : (
          <View style={s.pickerWrap}>
            <Pressable style={s.timeButton} onPress={() => setAndroidPickerOpen(true)} accessibilityRole="button">
              <Text style={s.timeButtonText}>{timeLabel(draft.hour, draft.minute)}</Text>
            </Pressable>
            {androidPickerOpen ? (
              <DateTimePicker
                value={timeValue}
                mode="time"
                is24Hour={false}
                onValueChange={onTime}
                onDismiss={() => setAndroidPickerOpen(false)}
              />
            ) : null}
          </View>
        )}
        {!draft.hourUnknown ? <Text style={s.hint}>{timeLabel(draft.hour, draft.minute)} · 한국 시각 기준으로 적어 주세요.</Text> : null}
      </View>

      <View style={s.field}>
        <Text style={s.label}>성별</Text>
        <View style={s.genderRow} accessibilityRole="radiogroup">
          {genderOption('female', '여성')}
          {genderOption('male', '남성')}
        </View>
        {errors.gender ? <Text style={s.error}>{errors.gender}</Text> : <Text style={s.hint}>대운의 방향(순행·역행)을 정할 때 써요.</Text>}
      </View>

      {formError ? <Text style={s.formError}>{formError}</Text> : null}
      <Button title={saving ? '저장하는 중…' : submitLabel} onPress={submit} disabled={saving} />
    </View>
  );
}
