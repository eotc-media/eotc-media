"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { ScrollableSelect } from "@/components/ui/scrollable-select"
import type { QzQuestion, QzChoice, QzCategory, QzSubCategory, QzLanguage, QzDifficulty } from "@/types/models/quiz"

interface Props {
  categories: QzCategory[]
  subCategories: QzSubCategory[]
  languages: QzLanguage[]
  difficulties: QzDifficulty[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizBatchClient({ categories, subCategories, languages, difficulties }: Props) {
  const [languageId, setLanguageId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subCategoryId, setSubCategoryId] = useState("")
  const [difficultyId, setDifficultyId] = useState("")

  const [questions, setQuestions] = useState<QzQuestion[]>([])
  const [shuffledChoices, setShuffledChoices] = useState<Record<number, QzChoice[]>>({})
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // answers: questionId → choiceId
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const filteredCategories = useMemo(
    () => languageId
      ? categories.filter(c => c.languageId == null || c.languageId === parseInt(languageId))
      : categories,
    [categories, languageId]
  )

  const filteredSubCategories = useMemo(
    () => categoryId ? subCategories.filter(sc => sc.categoryId === parseInt(categoryId)) : [],
    [subCategories, categoryId]
  )

  function handleLanguageChange(val: string) {
    setLanguageId(val)
    setCategoryId("")
    setSubCategoryId("")
  }

  function handleCategoryChange(val: string) {
    setCategoryId(val)
    setSubCategoryId("")
  }

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setLoaded(false)
    setAnswers({})
    setSubmitted(false)
    setScore(0)

    const params = new URLSearchParams({ random: "1" })
    if (languageId) params.set("language", languageId)
    if (categoryId) params.set("category", categoryId)
    if (subCategoryId) params.set("subCategory", subCategoryId)
    if (difficultyId) params.set("difficulty", difficultyId)

    try {
      const res = await fetch(`/api/quiz?${params}`)
      if (res.ok) {
        const data = await res.json()
        const qs: QzQuestion[] = data.questions
        setQuestions(qs)
        const sc: Record<number, QzChoice[]> = {}
        qs.forEach(q => { sc[q.id] = shuffle(q.choices ?? []) })
        setShuffledChoices(sc)
        setLoaded(true)
      }
    } finally {
      setLoading(false)
    }
  }, [languageId, categoryId, subCategoryId, difficultyId])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  function handleSubmit() {
    let correct = 0
    questions.forEach(q => {
      const chosen = answers[q.id]
      if (chosen !== undefined) {
        const choice = q.choices?.find(c => c.id === chosen)
        if (choice?.isCorrect) correct++
      }
    })
    setScore(correct)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleReset() {
    window.scrollTo({ top: 0, behavior: "smooth" })
    loadQuestions()
  }

  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div>
      {/* Filters — same ScrollableSelect row the hymn/sermon pages use */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <ScrollableSelect
            value={languageId || "_"}
            onValueChange={v => handleLanguageChange(v === "_" ? "" : v)}
            options={[
              { value: "_", label: "All languages" },
              ...languages.map(l => ({ value: String(l.id), label: l.name })),
            ]}
            className="w-full sm:w-[145px]"
          />
          <ScrollableSelect
            value={categoryId || "_"}
            onValueChange={v => handleCategoryChange(v === "_" ? "" : v)}
            options={[
              { value: "_", label: "All categories" },
              ...filteredCategories.map(c => ({ value: String(c.id), label: c.name })),
            ]}
            className="w-full sm:w-[185px]"
          />
          <ScrollableSelect
            value={subCategoryId || "_"}
            onValueChange={v => setSubCategoryId(v === "_" ? "" : v)}
            options={[
              { value: "_", label: "All sub-categories" },
              ...filteredSubCategories.map(sc => ({ value: String(sc.id), label: sc.name })),
            ]}
            className="w-full sm:w-[185px]"
          />
          <ScrollableSelect
            value={difficultyId || "_"}
            onValueChange={v => setDifficultyId(v === "_" ? "" : v)}
            options={[
              { value: "_", label: "All difficulties" },
              ...difficulties.map(d => ({ value: String(d.id), label: d.name })),
            ]}
            className="w-full sm:w-[145px]"
          />
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
      </div>

      {/* Score banner */}
      {submitted && (
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-4 ${
          score / questions.length >= 0.7
            ? "bg-green-50 border border-green-200"
            : "bg-amber-50 border border-amber-200"
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
            score / questions.length >= 0.7 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {Math.round((score / questions.length) * 100)}%
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {score} / {questions.length} correct
            </p>
            <p className="text-sm text-slate-500">
              {score / questions.length >= 0.7 ? "Great job! Keep it up." : "Keep practicing, you'll improve!"}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Questions */}
      {loaded && questions.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium">No questions found</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      )}

      {loaded && questions.length > 0 && (
        <>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const chosen = answers[q.id]
              const choices = shuffledChoices[q.id] ?? q.choices ?? []

              return (
                <div key={q.id} className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                  submitted
                    ? chosen !== undefined
                      ? q.choices?.find(c => c.id === chosen)?.isCorrect
                        ? "border-green-300"
                        : "border-red-300"
                      : "border-slate-200"
                    : "border-slate-200"
                }`}>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                      {q.difficulty && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{q.difficulty.name}</span>
                        </div>
                      )}
                    </div>
                    {submitted && chosen !== undefined && (
                      q.choices?.find(c => c.id === chosen)?.isCorrect
                        ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    {choices.map((choice, ci) => {
                      const isSelected = chosen === choice.id
                      const showResult = submitted

                      let choiceCls = "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors "
                      if (showResult) {
                        if (choice.isCorrect) choiceCls += "border-green-300 bg-green-50 text-green-800"
                        else if (isSelected && !choice.isCorrect) choiceCls += "border-red-300 bg-red-50 text-red-800"
                        else choiceCls += "border-slate-200 text-slate-500"
                      } else {
                        choiceCls += isSelected
                          ? "border-blue-400 bg-blue-50 text-slate-900"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                      }

                      return (
                        <label key={choice.id} className={choiceCls}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={choice.id}
                            checked={isSelected}
                            disabled={submitted}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice.id }))}
                            className="w-4 h-4 accent-blue-600 flex-shrink-0 cursor-pointer"
                          />
                          <span className="text-sm leading-snug">{choice.choiceText}</span>
                          {showResult && choice.isCorrect && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submit bar */}
          {!submitted && (
            <div className="sticky bottom-0 mt-6 bg-white border-t border-slate-200 py-4 pr-36 flex items-center justify-between gap-4">
              <button
                onClick={handleSubmit}
                disabled={answeredCount === 0}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Submit answers
              </button>
              <p className="hidden sm:block text-sm text-slate-500">
                {answeredCount} of {questions.length} answered
                {unansweredCount > 0 && (
                  <span className="text-amber-600 ml-1">({unansweredCount} remaining)</span>
                )}
              </p>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="text-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-slate-300" />
          <p className="text-sm mt-4">Loading questions...</p>
        </div>
      )}
    </div>
  )
}

