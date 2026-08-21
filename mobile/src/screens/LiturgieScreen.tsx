import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Platform } from 'react-native'
import { parse } from 'node-html-parser'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Screen } from '../components/Screen'
import { Icon } from '../components/Icon'
import { SkeletonBlock } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'

const CACHE_PREFIX = 'aelf_cache_v1_'

interface Lecture {
  titre: string
  ref: string
  contenu: string
  isEvangile: boolean
}

interface LiturgieData {
  date: string
  couleur: string
  fete: string
  lectures: Lecture[]
}

const COULEURS: Record<string, { color: string; label: string }> = {
  vert: { color: '#388E3C', label: 'Temps Ordinaire' },
  rouge: { color: '#C62828', label: 'Martyrs · Pentecôte' },
  violet: { color: '#6A1B9A', label: 'Avent · Carême' },
  blanc: { color: '#546E7A', label: 'Fêtes du Seigneur' },
  rose: { color: '#C2185B', label: 'Gaudete · Laetare' },
  or: { color: '#F57F17', label: 'Solennité' },
}

function detectCouleur(html: string) {
  if (/couleur[_-]?violet|carême|avent/i.test(html)) return 'violet'
  if (/couleur[_-]?rouge|rouge\.svg/i.test(html)) return 'rouge'
  if (/couleur[_-]?blanc|blanc\.svg/i.test(html)) return 'blanc'
  if (/couleur[_-]?rose/i.test(html)) return 'rose'
  if (/couleur[_-]?or/i.test(html)) return 'or'
  return 'vert'
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseAelf(html: string, dateStr: string): LiturgieData {
  const root = parse(html)
  const couleur = detectCouleur(html)
  const fete = (root.querySelector('.fete') || root.querySelector('.celebration_name'))?.text.trim() ?? ''

  const lectures: Lecture[] = root.querySelectorAll('.lecture').map((el) => {
    const titre = el.querySelector('h4')?.text.trim() ?? ''
    const refRaw = el.querySelector('h5')?.text.trim() ?? ''
    const refMatch = refRaw.match(/\(([^)]+)\)/)
    const ref = refMatch ? refMatch[1] : refRaw.replace(/«[^»]*»/g, '').trim()

    el.querySelectorAll('h4').forEach((h) => h.remove())
    el.querySelectorAll('h5').forEach((h) => h.remove())
    el.querySelectorAll('.lecture_link').forEach((h) => h.remove())

    const t = titre.toLowerCase()
    return {
      titre,
      ref,
      contenu: stripHtml(el.innerHTML.trim()),
      isEvangile: t.includes('évangile') || t.includes('evangile'),
    }
  })

  const date = new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return { date, couleur, fete, lectures }
}

async function fetchLiturgie(date: string): Promise<LiturgieData> {
  const res = await fetch(`https://www.aelf.org/${date}/romain/messe`, {
    headers: { 'User-Agent': Platform.select({ ios: 'Mozilla/5.0 (iPhone)', android: 'Mozilla/5.0 (Android)', default: 'Mozilla/5.0' }) },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseAelf(await res.text(), date)
}

async function getCachedLiturgie(date: string): Promise<LiturgieData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + date)
    return raw ? (JSON.parse(raw) as LiturgieData) : null
  } catch {
    return null
  }
}

async function setCachedLiturgie(date: string, data: LiturgieData) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + date, JSON.stringify(data))
  } catch {
    // cache best-effort — pas grave si indisponible
  }
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function LectureCard({ lecture, defaultOpen = false }: { lecture: Lecture; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const preview = lecture.contenu.slice(0, 160)

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={[styles.lectureCard, lecture.isEvangile && styles.lectureCardEvangile]}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.lectureEyebrow, { color: lecture.isEvangile ? colors.accent : colors.primary }]}>
            {lecture.isEvangile ? '✚ ' : ''}{lecture.titre.toUpperCase()}
          </Text>
          <Text style={styles.lectureRef}>{lecture.ref || lecture.titre}</Text>
          {!open && preview && <Text style={styles.lecturePreview} numberOfLines={2}>{preview}…</Text>}
        </View>
        <Icon name="caret-right" size={16} color={colors.mutedForeground} style={open ? { transform: [{ rotate: '90deg' }] } : undefined} />
      </View>
      {open && <Text style={styles.lectureFull}>{lecture.contenu}</Text>}
    </Pressable>
  )
}

export function LiturgieScreen() {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [data, setData] = useState<LiturgieData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let hadCache = false
    let receivedFresh = false
    setError(false)
    setData(null)
    setLoading(true)

    getCachedLiturgie(selectedDate).then((cached) => {
      if (cancelled || !cached || receivedFresh) return
      hadCache = true
      setData(cached)
      setLoading(false)
    })

    fetchLiturgie(selectedDate)
      .then((fresh) => {
        if (cancelled) return
        receivedFresh = true
        setData(fresh)
        setCachedLiturgie(selectedDate, fresh)
      })
      .catch(() => {
        if (!cancelled && !hadCache) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedDate])

  function changeDate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const isToday = selectedDate === todayISO()
  const coul = COULEURS[data?.couleur ?? 'vert']

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{data?.date ?? 'Chargement…'}</Text>
            {data?.fete ? <Text style={styles.mutedSm}>{data.fete}</Text> : null}
          </View>
          {data && (
            <View style={[styles.badge, { borderColor: coul.color }]}>
              <View style={[styles.badgeDot, { backgroundColor: coul.color }]} />
              <Text style={[styles.badgeText, { color: coul.color }]}>{coul.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.dateNav}>
          <Pressable onPress={() => changeDate(-1)} style={styles.navBtn}>
            <Icon name="caret-right" size={14} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
          <TextInput
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="AAAA-MM-JJ"
            style={styles.dateInput}
          />
          <Pressable onPress={() => changeDate(1)} style={styles.navBtn}>
            <Icon name="caret-right" size={14} color={colors.primary} />
          </Pressable>
          {!isToday && (
            <Pressable onPress={() => setSelectedDate(todayISO())} style={styles.todayBtn}>
              <Text style={styles.todayBtnText}>Aujourd'hui</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 12, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {loading && !data && (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.lectureCard, { gap: 8 }]}>
                <SkeletonBlock style={{ width: 110, height: 11 }} />
                <SkeletonBlock style={{ width: '70%', height: 18 }} />
                <SkeletonBlock style={{ width: '100%', height: 13 }} />
                <SkeletonBlock style={{ width: '85%', height: 13 }} />
              </View>
            ))}
          </View>
        )}

        {error && !loading && !data && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Icon name="book-open" size={40} color={colors.mutedForeground} />
            <Text style={styles.mutedSm}>Lectures non disponibles pour cette date.</Text>
            <Pressable
              onPress={() => { setLoading(true); fetchLiturgie(selectedDate).then(setData).catch(() => setError(true)).finally(() => setLoading(false)) }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {data && (
          <>
            {data.lectures.filter((l) => l.isEvangile).map((l, i) => <LectureCard key={`ev-${i}`} lecture={l} defaultOpen />)}
            {data.lectures.filter((l) => !l.isEvangile).map((l, i) => <LectureCard key={`l-${i}`} lecture={l} />)}
            {data.lectures.length === 0 && <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 20 }]}>Aucune lecture trouvée pour cette date.</Text>}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.primary, textTransform: 'capitalize' },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 9, textTransform: 'uppercase' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  navBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  dateInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 34, fontFamily: fonts.sans, fontSize: 12, color: colors.foreground },
  todayBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.primaryForeground },
  lectureCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  lectureCardEvangile: { borderWidth: 2, borderColor: 'rgba(200,155,60,0.4)' },
  lectureEyebrow: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.5, marginBottom: 3 },
  lectureRef: { fontFamily: fonts.heading, fontSize: 15, color: colors.primary },
  lecturePreview: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic', marginTop: 6, lineHeight: 17 },
  lectureFull: { fontFamily: fonts.sans, fontSize: 14, color: colors.foreground, lineHeight: 21, marginTop: 12 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  retryBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primaryForeground },
})
