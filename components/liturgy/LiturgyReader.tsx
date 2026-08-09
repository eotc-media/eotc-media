"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Play, Pause, Music, BookOpenText, Check, Languages, ChevronDown } from "lucide-react"
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

const AUDIO_LABELS: Record<AudioType, string> = {
  geez: "Ge'ez",
  ezil: "Ezil",
  araray: "Araray",
}

function getAvailableAudio(text: LiturgicalText): { type: AudioType; path: string }[] {
  const result: { type: AudioType; path: string }[] = []
  if (text.audioGeezFilePath) result.push({ type: "geez", path: text.audioGeezFilePath })
  if (text.audioEzilFilePath) result.push({ type: "ezil", path: text.audioEzilFilePath })
  if (text.audioArarayFilePath) result.push({ type: "araray", path: text.audioArarayFilePath })
  return result
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
  const [showLanguageOptions, setShowLanguageOptions] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sectionTabsRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  )

  const hasMultipleAudioTypes = useMemo(() => {
    if (!activeSection) return false
    return activeSection.texts.some((t) => getAvailableAudio(t).length > 1)
  }, [activeSection])

  const activeLanguageCount = Object.values(languageVisibility).filter(Boolean).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageOptions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (sectionTabsRef.current && activeSectionId) {
      const activeTab = sectionTabsRef.current.querySelector(
        `[data-section-id="${activeSectionId}"]`
      ) as HTMLElement
      if (activeTab) activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [activeSectionId])

  const playAudio = (path: string, textId: number) => {
    const key = `${textId}-${path}`
    if (audioRef.current) {
      if (playingAudioId === key) {
        audioRef.current.pause()
        setPlayingAudioId(null)
      } else {
        audioRef.current.src = path
        audioRef.current.play()
        setPlayingAudioId(key)
      }
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

  const sectionLinkClass = (active: boolean) =>
    `px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 lg:w-full lg:text-left lg:whitespace-normal ${
      active
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`

  const sectionName = activeSection
    ? locale === "am" ? activeSection.nameAmharic : activeSection.nameEnglish
    : ""

  return (
    <div className="min-h-screen bg-slate-50/40">
      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

      <div className="max-w-full mx-auto lg:grid lg:grid-cols-[220px_1fr]">

        {/* ─── Sections — sidebar on desktop, scrolling chips on mobile ─── */}
        <aside className="
          flex flex-row items-center gap-1.5 px-4 py-2.5 bg-white border-b border-slate-200/70
          overflow-x-auto scrollbar-hide
          lg:flex-col lg:items-stretch lg:gap-1 lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0 lg:border-r lg:sticky lg:top-16 lg:self-start lg:h-[calc(100vh-4rem)] lg:px-3 lg:py-4
        ">
          <div ref={sectionTabsRef} className="flex flex-row items-center gap-1.5 flex-nowrap lg:flex-col lg:items-stretch lg:gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                data-section-id={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={sectionLinkClass(activeSectionId === section.id)}
              >
                {locale === "am" ? section.nameAmharic : section.nameEnglish}
              </button>
            ))}
          </div>
        </aside>

        {/* ─── Main column — content starts at the top, no toolbar strip ─── */}
        <main className="min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Section heading with the controls tucked to its right */}
          <div className="max-w-3xl flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-[22px] sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">
                {sectionName}
              </h1>
              {activeSection && activeSection.texts.length > 0 && (
                <p className="mt-1 text-[13px] text-slate-400">
                  {activeSection.texts.length} {activeSection.texts.length === 1 ? "passage" : "passages"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasMultipleAudioTypes && (
                <div className="hidden sm:flex items-center gap-0.5 bg-white border border-slate-200/70 rounded-full p-0.5 shadow-sm">
                  <Music className="h-3.5 w-3.5 text-slate-400 ml-2 mr-0.5" />
                  {(["geez", "ezil", "araray"] as AudioType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setGlobalAudioType(type)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-all ${
                        globalAudioType === type
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {AUDIO_LABELS[type]}
                    </button>
                  ))}
                </div>
              )}

              {/* Language visibility */}
              <div className="relative" ref={languageMenuRef}>
                <button
                  onClick={() => setShowLanguageOptions(!showLanguageOptions)}
                  className={`flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-full text-[13px] font-medium border cursor-pointer transition-all shadow-sm ${
                    showLanguageOptions
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200/70 hover:border-slate-300"
                  }`}
                >
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("liturgy_language_btn")}</span>
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                    showLanguageOptions ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {activeLanguageCount}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLanguageOptions ? "rotate-180" : ""}`} />
                </button>

                {showLanguageOptions && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-900/[0.08] border border-slate-200/70 p-1.5 z-50">
                    <p className="px-2.5 pt-2 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                      {t("liturgy_select_langs")}
                    </p>
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
                          className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-left"
                        >
                          <span className={`w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                            on ? "bg-slate-900" : "border-[1.5px] border-slate-200"
                          }`}>
                            {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-slate-800 truncate">{label}</span>
                            <span className="block text-[11px] text-slate-400 truncate">{sub}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile audio picker — kept out of the heading row so it can wrap */}
          {hasMultipleAudioTypes && (
            <div className="sm:hidden max-w-3xl -mt-2 mb-5 flex items-center gap-0.5 bg-white border border-slate-200/70 rounded-full p-0.5 w-fit shadow-sm">
              <Music className="h-3.5 w-3.5 text-slate-400 ml-2 mr-0.5" />
              {(["geez", "ezil", "araray"] as AudioType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setGlobalAudioType(type)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full cursor-pointer transition-all ${
                    globalAudioType === type ? "bg-slate-900 text-white" : "text-slate-500"
                  }`}
                >
                  {AUDIO_LABELS[type]}
                </button>
              ))}
            </div>
          )}

          {/* ─── Passages ─── */}
          {activeSection && activeSection.texts.length > 0 ? (
            <div className="max-w-3xl flex flex-col gap-3">
              {activeSection.texts.map((text) => {
                const audioPath = getAudioForText(text)
                const audioKey = audioPath ? `${text.id}-${audioPath}` : null
                const isPlaying = playingAudioId === audioKey

                return (
                  <article
                    key={text.id}
                    className={`group rounded-2xl bg-white p-4 sm:p-5 border transition-all duration-200 ${
                      isPlaying
                        ? "border-slate-900/20 ring-1 ring-slate-900/10 shadow-md"
                        : "border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300/80 hover:shadow-md"
                    }`}
                  >
                    {/* Speaker + audio */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {getRoleName(text.role)}
                      </span>

                      {audioPath && (
                        <button
                          onClick={() => playAudio(audioPath, text.id)}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          className={`flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-full text-[12px] font-medium cursor-pointer transition-all flex-shrink-0 ${
                            isPlaying
                              ? "bg-slate-900 text-white"
                              : "text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          <span>{isPlaying ? "Pause" : "Play"}</span>
                        </button>
                      )}
                    </div>

                    {/* Text */}
                    <div className="space-y-2.5">
                      {languageVisibility.geez && text.textGeez && (
                        <p className="text-[18px] sm:text-[20px] leading-[1.9] text-slate-900 font-semibold tracking-wide" dir="auto">
                          {text.textGeez}
                        </p>
                      )}
                      {languageVisibility.amharic && text.textAmharic && (
                        <p className="text-[15px] sm:text-[16px] leading-[1.8] text-slate-700" dir="auto">
                          {text.textAmharic}
                        </p>
                      )}
                      {languageVisibility.transliteration && text.textEnglishTransliteration && (
                        <p className="text-[13px] sm:text-[14px] leading-relaxed text-slate-400 italic">
                          {text.textEnglishTransliteration}
                        </p>
                      )}
                      {languageVisibility.translation && text.textEnglishTranslation && (
                        <p className="text-[13px] sm:text-[14px] leading-relaxed text-slate-500">
                          {text.textEnglishTranslation}
                        </p>
                      )}
                    </div>

                    {/* Rubric */}
                    {text.remark && (
                      <p className="mt-3.5 rounded-xl bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-500 italic" dir="auto">
                        {text.remark}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          ) : activeSection ? (
            <div className="max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BookOpenText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 font-medium">{t("liturgy_no_section")}</p>
            </div>
          ) : (
            <div className="max-w-3xl py-24 text-center">
              <p className="text-sm text-slate-400">Select a section to begin reading</p>
            </div>
          )}

          <div className="h-16" />
        </main>
      </div>
    </div>
  )
}
