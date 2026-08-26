"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Play, Pause, Music, BookOpenText, Check, Type, Layers, ScrollText } from "lucide-react"
import { useLocale } from "@/lib/i18n/LocaleContext"

// ── Types ──────────────────────────────────────────────

interface Role {
  id: number
  roleKey: string
  nameEnglish: string
  nameAmharic: string
}

interface LiturgicalText {
  id: number
  orderIndex: number
  textGeez: string
  textAmharic: string
  textEnglishTransliteration: string
  textEnglishTranslation: string
  remark: string | null
  audioGeezFilePath: string | null
  audioEzilFilePath: string | null
  audioArarayFilePath: string | null
  role: Role
}

interface Section {
  id: number
  nameEnglish: string
  nameAmharic: string
  nameGeez: string
  orderIndex: number
  texts: LiturgicalText[]
}

interface LiturgyReaderProps {
  sections: Section[]
  roles: Role[]
}

interface LanguageVisibility {
  geez: boolean
  amharic: boolean
  transliteration: boolean
  translation: boolean
}

type RoleLanguage = "english" | "amharic"
type AudioType = "geez" | "ezil" | "araray"
type FontSize = "sm" | "base" | "lg"

const AUDIO_LABELS: Record<AudioType, string> = {
  geez: "Ge'ez",
  ezil: "Ezil",
  araray: "Araray",
}

// Ge'ez leads each card and the other layers follow it at one shared size.
//
// `layerEthiopic` is that same step nudged up: Ethiopic glyphs have a smaller
// apparent size than Latin at an identical pixel value, so an Amharic line set
// to match the English one numerically still reads as the smaller of the two.
// The bump is what makes them look equal, which is the point.
const FONT_SCALE: Record<FontSize, { geez: string; layer: string; layerEthiopic: string }> = {
  sm:   { geez: "text-[17px] sm:text-[18px]", layer: "text-[13px] sm:text-[14px]", layerEthiopic: "text-[15px] sm:text-[16px]" },
  base: { geez: "text-[19px] sm:text-[21px]", layer: "text-[14px] sm:text-[15px]", layerEthiopic: "text-[16px] sm:text-[17px]" },
  lg:   { geez: "text-[22px] sm:text-[25px]", layer: "text-[16px] sm:text-[17px]", layerEthiopic: "text-[18px] sm:text-[19px]" },
}

// Speakers are told apart by a small tinted monogram rather than a bar down the
// side of the card — enough to scan a dialogue by, without striping the page.
const ROLE_MONOGRAM: Record<string, string> = {
  priest: "bg-rose-50 text-rose-600",
  deacon: "bg-sky-50 text-sky-600",
  people: "bg-emerald-50 text-emerald-600",
  choir: "bg-violet-50 text-violet-600",
  assistant_priest: "bg-amber-50 text-amber-600",
  assistant_deacon: "bg-cyan-50 text-cyan-600",
}
const DEFAULT_MONOGRAM = "bg-slate-100 text-slate-500"

// Ge'ez syllables carry a whole sound, so one is enough; Latin needs two so
// Priest and People don't both show up as "P".
function monogramFor(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const isGeez = trimmed.codePointAt(0)! >= 0x1200 && trimmed.codePointAt(0)! <= 0x137f
  return isGeez ? trimmed.slice(0, 1) : trimmed.slice(0, 2)
}

function getAvailableAudio(text: LiturgicalText): { type: AudioType; path: string }[] {
  const result: { type: AudioType; path: string }[] = []
  if (text.audioGeezFilePath) result.push({ type: "geez", path: text.audioGeezFilePath })
  if (text.audioEzilFilePath) result.push({ type: "ezil", path: text.audioEzilFilePath })
  if (text.audioArarayFilePath) result.push({ type: "araray", path: text.audioArarayFilePath })
  return result
}

// ── Section grouping ───────────────────────────────────
//
// The service falls in two halves — the pre-anaphora and the anaphora proper —
// but the database stores sections as one flat ordered run with nothing marking
// where the second half starts. It is inferred from the name here: the
// anaphoras are titled "Anaphora of …" in English and "ቅዳሴ ዘ…" in Ge'ez and
// Amharic.
//
// If that inference finds nothing, the list is shown ungrouped rather than
// under two headings one of which would be empty. Adjust this one predicate if
// the section names do not follow that pattern.
function isAnaphora(section: Section): boolean {
  if (section.nameEnglish.toLowerCase().includes("anaphora")) return true
  return /ቅዳሴ\s*ዘ/.test(section.nameGeez) || /ቅዳሴ\s*ዘ/.test(section.nameAmharic)
}

// ── Main Component ─────────────────────────────────────

export function LiturgyReader({ sections }: LiturgyReaderProps) {
  const { locale, t } = useLocale()
  const [activeSectionId, setActiveSectionId] = useState<number | null>(
    sections.length > 0 ? sections[0].id : null
  )
  const [languageVisibility, setLanguageVisibility] = useState<LanguageVisibility>({
    geez: true,
    amharic: true,
    transliteration: true,
    translation: true,
  })
  const roleLanguage: RoleLanguage = locale === "am" ? "amharic" : "english"
  const [globalAudioType, setGlobalAudioType] = useState<AudioType>("geez")
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState<FontSize>("base")
  const [showRemarks, setShowRemarks] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sectionTabsRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  )

  const groups = useMemo(() => {
    const pre = sections.filter((s) => !isAnaphora(s))
    const ana = sections.filter(isAnaphora)
    if (pre.length === 0 || ana.length === 0) {
      return [{ label: null as string | null, items: sections }]
    }
    return [
      { label: locale === "am" ? "ቅድመ ቅዳሴ" : "Pre-anaphora", items: pre },
      { label: locale === "am" ? "ቅዳሴ" : "Anaphora", items: ana },
    ]
  }, [sections, locale])

  const hasMultipleAudioTypes = useMemo(() => {
    if (!activeSection) return false
    return activeSection.texts.some((t) => getAvailableAudio(t).length > 1)
  }, [activeSection])

  const activeLanguageCount = Object.values(languageVisibility).filter(Boolean).length
  const scale = FONT_SCALE[fontSize]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!sectionTabsRef.current) return
    const activeTab = sectionTabsRef.current.querySelector<HTMLElement>(
      `[data-section-id="${activeSectionId}"]`
    )
    activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeSectionId])

  const playAudio = (path: string, textId: number) => {
    const key = `${textId}-${path}`
    if (playingAudioId === key) {
      audioRef.current?.pause()
      setPlayingAudioId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.src = path
      audioRef.current.play().catch(() => setPlayingAudioId(null))
      setPlayingAudioId(key)
    }
  }

  const getAudioForText = (text: LiturgicalText): string | null => {
    const available = getAvailableAudio(text)
    if (available.length === 0) return null
    const preferred = available.find((a) => a.type === globalAudioType)
    return preferred ? preferred.path : available[0].path
  }

  const handleSectionChange = (id: number) => {
    setActiveSectionId(id)
    setPlayingAudioId(null)
    setMobileMenuOpen(false)
    if (audioRef.current) audioRef.current.pause()
  }

  const getRoleName = (role: Role) =>
    roleLanguage === "amharic" ? role.nameAmharic : role.nameEnglish

  const toggleLanguage = (lang: keyof LanguageVisibility) =>
    setLanguageVisibility((prev) => ({ ...prev, [lang]: !prev[lang] }))

  // ── Empty state ──────────────────────────────────────

  if (sections.length === 0) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <BookOpenText className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1.5">{t("liturgy_no_content")}</h2>
        <p className="text-sm text-slate-400 text-center max-w-sm">{t("liturgy_no_content_msg")}</p>
      </div>
    )
  }

  const sectionButtonClass = (active: boolean) =>
    `group relative flex items-center gap-2.5 pl-3.5 pr-3 py-2 rounded-lg text-sm text-left transition-all duration-100 cursor-pointer whitespace-nowrap lg:w-full lg:whitespace-normal ${
      active
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
    }`

  const sectionList = (
    <>
      {groups.map((group, gi) => (
        <div key={group.label ?? gi} className="mb-2 lg:mb-3 flex items-center lg:block gap-1">
          {group.label && (
            <div className="hidden lg:flex items-center gap-2 px-2 pt-2 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                {group.label}
              </span>
              <span className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-medium text-slate-300 tabular-nums">
                {group.items.length}
              </span>
            </div>
          )}
          {/* On the mobile strip a hairline stands in for the heading, so the
              two halves stay distinguishable without spending a row on labels. */}
          {group.label && gi > 0 && (
            <span className="lg:hidden w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />
          )}
          <div className="flex flex-row items-center gap-1 lg:flex-col lg:items-stretch lg:gap-0.5">
            {group.items.map((section) => {
              const active = activeSectionId === section.id
              return (
                <button
                  key={section.id}
                  data-section-id={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={sectionButtonClass(active)}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full bg-blue-500 transition-all ${
                      active ? "h-5 opacity-100" : "h-0 opacity-0"
                    }`}
                  />
                  {locale === "am" ? section.nameAmharic : section.nameEnglish}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )

  // The whole control panel, shared by the desktop right column and the mobile
  // dropdown so the two can never drift apart.
  const controls = (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
          <Layers className="h-3 w-3" /> {t("liturgy_select_langs")}
        </p>
        <div className="space-y-1">
          {[
            { key: "geez" as const, label: "ግዕዝ", sub: "Ge'ez" },
            { key: "amharic" as const, label: "አማርኛ", sub: "Amharic" },
            { key: "transliteration" as const, label: "Transliteration", sub: "Latin script" },
            { key: "translation" as const, label: "English", sub: "Translation" },
          ].map(({ key, label, sub }) => {
            const on = languageVisibility[key]
            return (
              <button
                key={key}
                onClick={() => toggleLanguage(key)}
                className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-xl border transition-colors text-left cursor-pointer ${
                  on
                    ? "border-blue-200 bg-blue-50/60"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                    on ? "bg-blue-600" : "border-[1.5px] border-slate-200"
                  }`}
                >
                  {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-medium truncate ${on ? "text-blue-800" : "text-slate-700"}`}>
                    {label}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">{sub}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {hasMultipleAudioTypes && (
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
            <Music className="h-3 w-3" /> Chant
          </p>
          <div className="flex items-center gap-1">
            {(["geez", "ezil", "araray"] as AudioType[]).map((type) => (
              <button
                key={type}
                onClick={() => setGlobalAudioType(type)}
                className={`flex-1 px-2 py-2 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors ${
                  globalAudioType === type
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                {AUDIO_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
          <Type className="h-3 w-3" /> Text size
        </p>
        <div className="flex gap-2">
          {(["sm", "base", "lg"] as FontSize[]).map((size, i) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-semibold border-2 transition-all cursor-pointer ${
                fontSize === size
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
              style={{ fontSize: i === 0 ? "13px" : i === 1 ? "16px" : "19px" }}
            >
              A
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowRemarks((v) => !v)}
          className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-xl border transition-colors text-left cursor-pointer ${
            showRemarks ? "border-blue-200 bg-blue-50/60" : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span
            className={`w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
              showRemarks ? "bg-blue-600" : "border-[1.5px] border-slate-200"
            }`}
          >
            {showRemarks && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <span className={`block text-[13px] font-medium ${showRemarks ? "text-blue-800" : "text-slate-700"}`}>
              Rubrics
            </span>
            <span className="block text-[11px] text-slate-400">Directions for the service</span>
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

      {/* Mobile bar: sections plus the control panel behind one button */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-slate-100 flex items-center gap-2 px-4 py-2">
        <div
          ref={sectionTabsRef}
          className="flex-1 min-w-0 flex flex-row items-center gap-1 overflow-x-auto scrollbar-hide"
        >
          {sectionList}
        </div>
        <div className="relative flex-shrink-0" ref={mobileMenuOpen ? menuRef : undefined}>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
              mobileMenuOpen
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-baseline gap-[1px] leading-none select-none" aria-hidden="true">
              <span className="text-[15px] font-semibold">ሀ</span>
              <span className="text-[11px] font-semibold">A</span>
            </span>
            <span
              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                mobileMenuOpen ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {activeLanguageCount}
            </span>
          </button>
          {mobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 z-50 shadow-lg">
              {controls}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full mx-auto lg:grid lg:grid-cols-[220px_1fr_256px]">

        {/* Left: sections, in their two liturgical halves */}
        <aside className="hidden lg:flex lg:flex-col border-r border-slate-100 sticky top-16 self-start h-[calc(100vh-4rem)] z-10">
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
            {sectionList}
          </div>
        </aside>

        {/* Center: the text */}
        <main className="min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          {activeSection && activeSection.texts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {activeSection.texts.map((text) => {
                const audioPath = getAudioForText(text)
                const audioKey = audioPath ? `${text.id}-${audioPath}` : null
                const isPlaying = playingAudioId === audioKey
                const roleName = getRoleName(text.role)
                const monogram = ROLE_MONOGRAM[text.role.roleKey] ?? DEFAULT_MONOGRAM

                // Everything after the Ge'ez shares one presentation, the way a
                // quiz card's choices do.
                const layers = [
                  { key: "amharic", ethiopic: true, text: languageVisibility.amharic ? text.textAmharic : "" },
                  { key: "transliteration", ethiopic: false, text: languageVisibility.transliteration ? text.textEnglishTransliteration : "" },
                  { key: "translation", ethiopic: false, text: languageVisibility.translation ? text.textEnglishTranslation : "" },
                ].filter((l) => l.text)

                return (
                  <article
                    key={text.id}
                    className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                      isPlaying ? "border-slate-400" : "border-slate-200"
                    }`}
                  >
                    {/* Header band, exactly where a quiz card puts its question:
                        the speaker's monogram stands in for the question number
                        and the Ge'ez for the question itself. */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-start gap-3">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${monogram}`}
                      >
                        {monogramFor(roleName)}
                      </span>

                      <div className="flex-1 min-w-0">
                        {languageVisibility.geez && text.textGeez && (
                          <p
                            className={`${scale.geez} font-semibold leading-[1.9] tracking-wide text-slate-900`}
                            dir="auto"
                          >
                            {text.textGeez}
                          </p>
                        )}
                        <div className={languageVisibility.geez && text.textGeez ? "mt-2" : ""}>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            {roleName}
                          </span>
                        </div>
                      </div>

                      {audioPath && (
                        <button
                          onClick={() => playAudio(audioPath, text.id)}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          className={`flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors flex-shrink-0 ${
                            isPlaying
                              ? "bg-slate-900 text-white"
                              : "text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          <span>{isPlaying ? "Pause" : "Play"}</span>
                        </button>
                      )}
                    </div>

                    {/* Body, where the choices sit */}
                    {(layers.length > 0 || (showRemarks && text.remark)) && (
                      <div className="p-4 space-y-2">
                        {layers.map((layer) => (
                          <div
                            key={layer.key}
                            className="px-4 py-3 rounded-lg border border-slate-200"
                          >
                            <p
                              className={`${layer.ethiopic ? scale.layerEthiopic : scale.layer} leading-[1.75] text-slate-700`}
                              dir="auto"
                            >
                              {layer.text}
                            </p>
                          </div>
                        ))}

                        {showRemarks && text.remark && (
                          <p
                            className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] leading-relaxed text-amber-800 italic"
                            dir="auto"
                          >
                            {text.remark}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : activeSection ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BookOpenText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 font-medium">{t("liturgy_no_section")}</p>
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-sm text-slate-400">Select a section to begin reading</p>
            </div>
          )}

          <div className="h-16" />
        </main>

        {/* Right: reading controls, all options on show */}
        <aside className="hidden lg:flex lg:flex-col border-l border-slate-100 sticky top-16 self-start h-[calc(100vh-4rem)]">
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <ScrollText className="h-4 w-4 text-slate-400" />
              {activeSection ? (locale === "am" ? activeSection.nameAmharic : activeSection.nameEnglish) : ""}
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
            {controls}
          </div>
        </aside>
      </div>
    </div>
  )
}
