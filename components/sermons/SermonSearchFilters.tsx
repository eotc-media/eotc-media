"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { ScrollableSelect } from "@/components/ui/scrollable-select"
import { useLocale } from "@/lib/i18n/LocaleContext"
import { SmCategory, SmSubCategory, SmLanguage } from "@/types/models/sermon"

interface SermonSearchFiltersProps {
  categories: SmCategory[]
  subCategories: SmSubCategory[]
  languages: SmLanguage[]
  categoriesByLanguage: Record<string, number[]>
  basePath?: string
  /** Show only the search box, with the dropdowns behind a Filters toggle. */
  collapsible?: boolean
}

export default function SermonSearchFilters({
  categories,
  subCategories,
  languages,
  categoriesByLanguage,
  basePath = "/sermons",
  collapsible = false,
}: SermonSearchFiltersProps) {
  const router = useRouter()
  const { t } = useLocale()
  const searchParams = useSearchParams()

  const activeLanguage = searchParams.get("language") ?? ""
  const activeCategory = searchParams.get("category") ?? ""
  const activeSubCategory = searchParams.get("subCategory") ?? ""
  const activeSearch = searchParams.get("search") ?? ""

  const [searchValue, setSearchValue] = useState(activeSearch)
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const composingRef = useRef(false)

  useEffect(() => {
    if (!composingRef.current) setSearchValue(activeSearch)
  }, [activeSearch])

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return params.toString()
  }

  function applyFilter(key: string, value: string) {
    const extra: Record<string, string> = { [key]: value }
    if (key === "language") { extra.category = ""; extra.subCategory = "" }
    if (key === "category") { extra.subCategory = "" }
    router.push(`${basePath}?${buildParams(extra)}`)
  }

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      if (composingRef.current) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        router.push(`${basePath}?${buildParams({ search: value })}`)
      }, 400)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams]
  )

  const visibleCategories = activeLanguage
    ? categories.filter(c => (categoriesByLanguage[activeLanguage] ?? []).includes(c.id))
    : []

  const visibleSubCategories = activeCategory
    ? subCategories.filter(sc => sc.categoryId === parseInt(activeCategory))
    : []

  const languageOptions = [
    { value: "_", label: t("sermon_select_language") },
    ...languages.map(l => ({ value: String(l.id), label: l.name })),
  ]

  const categoryOptions = [
    { value: "_", label: t("sermon_select_category") },
    ...visibleCategories.map(c => ({ value: String(c.id), label: c.name })),
  ]

  const subCategoryOptions = [
    { value: "_", label: t("sermon_select_subcategory") },
    ...visibleSubCategories.map(sc => ({ value: String(sc.id), label: sc.name })),
  ]

  const activeFilterCount = [activeLanguage, activeCategory, activeSubCategory].filter(Boolean).length

  const searchBox = (
    <div className="relative flex-1 min-w-0 sm:min-w-[150px] sm:max-w-[480px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        placeholder={t("sermon_search_placeholder")}
        value={searchValue}
        onChange={e => handleSearchChange(e.target.value)}
        onCompositionStart={() => { composingRef.current = true }}
        onCompositionEnd={e => { composingRef.current = false; handleSearchChange(e.currentTarget.value) }}
        className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder:text-slate-400"
      />
    </div>
  )

  const dropdowns = (
    <>
      <ScrollableSelect
        value={activeLanguage || "_"}
        onValueChange={raw => applyFilter("language", raw === "_" ? "" : raw)}
        options={languageOptions}
        searchable
        searchPlaceholder={t("search_placeholder")}
        className="w-full sm:w-[145px]"
      />
      <ScrollableSelect
        value={activeCategory || "_"}
        onValueChange={raw => applyFilter("category", raw === "_" ? "" : raw)}
        options={categoryOptions}
        searchable
        searchPlaceholder={t("search_placeholder")}
        className="w-full sm:w-[185px]"
      />
      <ScrollableSelect
        value={activeSubCategory || "_"}
        onValueChange={raw => applyFilter("subCategory", raw === "_" ? "" : raw)}
        options={subCategoryOptions}
        searchable
        searchPlaceholder={t("search_placeholder")}
        className="w-full sm:w-[185px]"
      />
    </>
  )

  // Detail pages keep the search box always visible and tuck the dropdowns
  // behind a toggle, so the filters stay reachable without dominating the page.
  if (collapsible) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 sm:flex-wrap">
          {searchBox}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`sm:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer flex-shrink-0 ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="hidden sm:contents">{dropdowns}</div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-3 gap-2 sm:hidden">{dropdowns}</div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {searchBox}
      <div className="grid grid-cols-3 gap-2 sm:contents">
        {dropdowns}
      </div>
    </div>
  )
}
