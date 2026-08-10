"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Play, Pause, Music, BookOpenText, Check, ChevronDown } from "lucide-react"
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
  const [openMenu, setOpenMenu] = useState<"mobile" | "desktop" | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sectionTabsRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenu(null)
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

  // Matches the sidebars in sermons, hymns and books.
  const sectionLinkClass = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 lg:w-full lg:text-left lg:whitespace-normal ${
      active
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`

  // One control holds both the visible layers and the chant mode, so neither
  // needs a strip of its own above the text.
  const settingsPanel = (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 p-1.5 z-50 shadow-sm">
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

      {hasMultipleAudioTypes && (
        <>
          <div className="mx-2.5 my-1.5 border-t border-slate-100" />
          <p className="px-2.5 pt-1 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] flex items-center gap-1.5">
            <Music className="h-3 w-3" /> Chant
          </p>
          <div className="flex items-center gap-1 px-1.5 pb-1.5">
            {(["geez", "ezil", "araray"] as AudioType[]).map((type) => (
              <button
                key={type}
                onClick={() => setGlobalAudioType(type)}
                className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-lg cursor-pointer transition-colors ${
                  globalAudioType === type
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-500 hover:text-slate-800"
                }`}
              >
                {AUDIO_LABELS[type]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )

  const settingsButton = (which: "mobile" | "desktop") => (
    <button
      onClick={() => setOpenMenu(openMenu === which ? null : which)}
      className={`flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
        openMenu === which
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className="flex items-baseline gap-[1px] leading-none select-none" aria-hidden="true">
        <span className="text-[15px] font-semibold">ሀ</span>
        <span className="text-[11px] font-semibold">A</span>
      </span>
      <span className="hidden xl:inline">{t("liturgy_language_btn")}</span>
      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
        openMenu === which ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
      }`}>
        {activeLanguageCount}
      </span>
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMenu === which ? "rotate-180" : ""}`} />
    </button>
  )

  return (
    <div className="min-h-screen bg-white">
      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

      <div className="max-w-full mx-auto lg:grid lg:grid-cols-[220px_1fr]">

        {/* ─── Sections — sidebar on desktop; on mobile it also carries the
             settings control, so nothing needs its own band ─── */}
        <aside className="
          sticky top-16 z-30 bg-white flex flex-row items-center gap-2 px-4 py-2 border-b border-slate-100
          lg:flex-col lg:items-stretch lg:gap-0.5 lg:border-b-0 lg:border-r lg:self-start lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-3 lg:py-4
        ">
          <div
            ref={sectionTabsRef}
            className="flex-1 min-w-0 flex flex-row items-center gap-1 overflow-x-auto scrollbar-hide lg:flex-none lg:w-full lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-x-visible"
          >
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

          <div className="relative flex-shrink-0 lg:hidden" ref={openMenu === "mobile" ? menuRef : undefined}>
            {settingsButton("mobile")}
            {openMenu === "mobile" && settingsPanel}
          </div>
        </aside>

        {/* ─── Main column — the text starts at the very top ─── */}
        <main className="relative min-w-0 px-4 sm:px-6 lg:px-8 lg:pr-56 py-5 sm:py-6">

          {/* Desktop control floats in the gutter beside the text, taking no row */}
          <div
            className="hidden lg:block fixed right-6 top-20 z-30"
            ref={openMenu === "desktop" ? menuRef : undefined}
          >
            <div className="relative">
              {settingsButton("desktop")}
              {openMenu === "desktop" && settingsPanel}
            </div>
          </div>

          {activeSection && activeSection.texts.length > 0 ? (
            <div className="max-w-3xl flex flex-col gap-2.5">
              {activeSection.texts.map((text) => {
                const audioPath = getAudioForText(text)
                const audioKey = audioPath ? `${text.id}-${audioPath}` : null
                const isPlaying = playingAudioId === audioKey
                const roleName = getRoleName(text.role)
                const monogram = ROLE_MONOGRAM[text.role.roleKey] ?? DEFAULT_MONOGRAM

                return (
                  <article
                    key={text.id}
                    className={`rounded-xl bg-white p-4 sm:p-5 border transition-colors ${
                      isPlaying ? "border-slate-400 bg-slate-50/60" : "border-slate-200"
                    }`}
                  >
                    {/* Speaker + audio */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${monogram}`}>
                          {monogramFor(roleName)}
                        </span>
                        <span className="text-[12px] font-semibold text-slate-600 truncate">
                          {roleName}
                        </span>
                      </div>

                      {audioPath && (
                        <button
                          onClick={() => playAudio(audioPath, text.id)}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          className={`flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors flex-shrink-0 ${
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
                      <p className="mt-3.5 rounded-lg bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-500 italic" dir="auto">
                        {text.remark}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          ) : activeSection ? (
            <div className="max-w-3xl rounded-xl border border-dashed border-slate-200 py-20 text-center">
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
