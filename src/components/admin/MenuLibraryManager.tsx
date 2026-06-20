"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Filter,
  Grid3X3,
  Heart,
  ImageIcon,
  LayoutList,
  Leaf,
  Pencil,
  Plus,
  Search,
  Star,
  Sun,
  TreePine,
  Upload,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { MealPreviewModal } from "@/components/admin/MealPreviewModal"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  CATEGORY_FILTER_PILLS,
  COMMON_ALLERGENS,
  COOKBOOK_TABS,
  countPhotoLibrary,
  formatCategoryLabel,
  formatGradeRange,
  formatLastUsedLabel,
  getDefaultTags,
  getLastLibraryUpdate,
  getMealCoverPhoto,
  getMostUsedMeal,
  GRADE_OPTIONS,
  isNewMeal,
  MEAL_CATEGORIES,
  MEAL_SORT_OPTIONS,
  PHOTO_SLOTS,
  sortMealTemplates,
} from "@/lib/meal-templates"
import { uploadMealPhoto } from "@/lib/meal-photo-upload"
import type {
  GradeAvailability,
  MealCategory,
  MealPhoto,
  MealPhotoSlot,
  MealTemplate,
  MealTemplateItem,
} from "@/lib/types"
import type { MealSortOption } from "@/lib/meal-templates"
import { cn } from "@/lib/utils"

type EditorTab = "details" | "photos" | "nutrition" | "pricing"
type ViewMode = "grid" | "list"

const NAVY = "#041B52"
const MEALS_PER_PAGE = 9

const PILL_ICONS: Record<MealCategory | "all", typeof Sun> = {
  all: UtensilsCrossed,
  breakfast: Sun,
  lunch: UtensilsCrossed,
  recipe: Pencil,
  dessert: Star,
  side: Leaf,
  drink: ImageIcon,
  special_event: Star,
  holiday: TreePine,
  seasonal: Leaf,
  archived: Archive,
}

function emptyTemplate(category: MealCategory = "lunch"): Omit<MealTemplate, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    description: "",
    category,
    mealType: category === "breakfast" ? "breakfast" : category === "lunch" ? "lunch" : "special",
    allergens: [],
    nutritionNotes: "",
    portionNotes: "",
    gradeAvailability: ["grades_7_8", "grades_9_12"],
    isReusable: true,
    isFavorite: false,
    isPublished: false,
    isArchived: false,
    studentMealPrice: 3.25,
    alaCartePrice: 4.5,
    staffMealPrice: 2.0,
    items: [],
    photos: [],
  }
}

function templateToDraft(template: MealTemplate): MealTemplate {
  return { ...template, items: [...template.items], photos: [...template.photos] }
}

export function MenuLibraryManager() {
  const {
    mealTemplates,
    notifications,
    addMealTemplate,
    updateMealTemplate,
    duplicateMealTemplate,
    archiveMealTemplate,
  } = useDemo()

  const [activeCategory, setActiveCategory] = useState<MealCategory | "all">("all")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<MealSortOption>("recent")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(mealTemplates[0]?.id ?? null)
  const [draft, setDraft] = useState<MealTemplate | null>(
    mealTemplates[0] ? templateToDraft(mealTemplates[0]) : null
  )
  const [editorTab, setEditorTab] = useState<EditorTab>("details")
  const [isCreating, setIsCreating] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<MealTemplate | null>(null)
  const [tagsByMeal, setTagsByMeal] = useState<Record<string, string[]>>({})
  const [dragSlot, setDragSlot] = useState<MealPhotoSlot | null>(null)
  const fileInputRefs = useRef<Partial<Record<MealPhotoSlot, HTMLInputElement | null>>>({})

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredTemplates = useMemo(() => {
    const filtered = mealTemplates.filter((t) => {
      const matchesCategory =
        activeCategory === "all"
          ? !t.isArchived
          : activeCategory === "archived"
            ? t.isArchived
            : !t.isArchived && t.category === activeCategory
      const matchesSearch =
        !search.trim() ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
    return sortMealTemplates(filtered, sortBy)
  }, [mealTemplates, activeCategory, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / MEALS_PER_PAGE))
  const paginatedTemplates = filteredTemplates.slice(
    (page - 1) * MEALS_PER_PAGE,
    page * MEALS_PER_PAGE
  )

  const activeTemplates = mealTemplates.filter((t) => !t.isArchived)
  const photoCount = countPhotoLibrary(mealTemplates)
  const mostUsed = getMostUsedMeal(mealTemplates)
  const lastUpdated = getLastLibraryUpdate(mealTemplates)
  const storageUsedGb = (photoCount * 0.0095).toFixed(1)

  const currentTags = useMemo(() => {
    if (!draft) return []
    return tagsByMeal[draft.id] ?? getDefaultTags(draft)
  }, [draft, tagsByMeal])

  const selectTemplate = useCallback((template: MealTemplate) => {
    setSelectedId(template.id)
    setDraft(templateToDraft(template))
    setIsCreating(false)
    setEditorTab("details")
  }, [])

  const closePanel = () => {
    setSelectedId(null)
    setDraft(null)
    setIsCreating(false)
  }

  const handleCreate = () => {
    const cat = activeCategory !== "all" && activeCategory !== "archived" ? activeCategory : "lunch"
    const blank = emptyTemplate(cat)
    const now = new Date().toISOString()
    const temp: MealTemplate = { ...blank, id: "new", createdAt: now, updatedAt: now }
    setDraft(temp)
    setSelectedId(null)
    setIsCreating(true)
    setEditorTab("details")
  }

  const handleSave = async () => {
    if (!draft || !draft.name.trim()) return
    const payload = {
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
      category: draft.category,
      mealType: draft.mealType,
      allergens: draft.allergens,
      nutritionNotes: draft.nutritionNotes?.trim() || undefined,
      portionNotes: draft.portionNotes?.trim() || undefined,
      gradeAvailability: draft.gradeAvailability,
      ingredients: draft.ingredients,
      isReusable: draft.isReusable,
      isFavorite: draft.isFavorite,
      isPublished: draft.isPublished,
      isArchived: draft.isArchived,
      studentMealPrice: draft.studentMealPrice,
      alaCartePrice: draft.alaCartePrice,
      staffMealPrice: draft.staffMealPrice,
      items: draft.items.map((item, i) => ({ ...item, sortOrder: i })),
      photos: draft.photos,
    }

    if (isCreating) {
      const created = await addMealTemplate(payload)
      setSelectedId(created.id)
      setDraft(templateToDraft(created))
      setIsCreating(false)
    } else if (selectedId) {
      await updateMealTemplate(selectedId, payload)
      const updated = mealTemplates.find((t) => t.id === selectedId)
      if (updated) setDraft(templateToDraft({ ...updated, ...payload, id: selectedId }))
    }
  }

  const handleDuplicate = async () => {
    if (!selectedId) return
    const dup = await duplicateMealTemplate(selectedId)
    selectTemplate(dup)
  }

  const handleArchive = async () => {
    if (!selectedId) return
    await archiveMealTemplate(selectedId)
    const next = filteredTemplates.find((t) => t.id !== selectedId)
    if (next) selectTemplate(next)
    else closePanel()
  }

  const toggleFavorite = async (e: React.MouseEvent, template: MealTemplate) => {
    e.stopPropagation()
    await updateMealTemplate(template.id, { isFavorite: !template.isFavorite })
    if (draft?.id === template.id) {
      setDraft({ ...draft, isFavorite: !template.isFavorite })
    }
  }

  const handlePhotoUpload = async (slot: MealPhotoSlot, file: File) => {
    if (!draft) return
    let url: string
    try {
      url = await uploadMealPhoto(file)
    } catch {
      url = URL.createObjectURL(file)
    }
    const existing = draft.photos.find((p) => p.slot === slot)
    const newPhoto: MealPhoto = { id: existing?.id ?? `mp-local-${Date.now()}`, slot, url }
    setDraft({
      ...draft,
      photos: existing
        ? draft.photos.map((p) => (p.slot === slot ? newPhoto : p))
        : [...draft.photos, newPhoto],
    })
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!draft) return
    const next = [...draft.items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraft({ ...draft, items: next.map((item, i) => ({ ...item, sortOrder: i })) })
  }

  const addCompositionItem = () => {
    if (!draft) return
    const item: MealTemplateItem = {
      id: `mti-local-${Date.now()}`,
      name: "New Item",
      sortOrder: draft.items.length,
    }
    setDraft({ ...draft, items: [...draft.items, item] })
  }

  const toggleAllergen = (allergen: string) => {
    if (!draft) return
    setDraft({
      ...draft,
      allergens: draft.allergens.includes(allergen)
        ? draft.allergens.filter((a) => a !== allergen)
        : [...draft.allergens, allergen],
    })
  }

  const toggleGrade = (grade: GradeAvailability) => {
    if (!draft) return
    setDraft({
      ...draft,
      gradeAvailability: draft.gradeAvailability.includes(grade)
        ? draft.gradeAvailability.filter((g) => g !== grade)
        : [...draft.gradeAvailability, grade],
    })
  }

  const addTag = (tag: string) => {
    if (!draft || !tag.trim()) return
    const existing = tagsByMeal[draft.id] ?? getDefaultTags(draft)
    if (existing.includes(tag.trim())) return
    setTagsByMeal({ ...tagsByMeal, [draft.id]: [...existing, tag.trim()] })
  }

  const removeTag = (tag: string) => {
    if (!draft) return
    const existing = tagsByMeal[draft.id] ?? getDefaultTags(draft)
    setTagsByMeal({ ...tagsByMeal, [draft.id]: existing.filter((t) => t !== tag) })
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Header */}
      <header className="border-b border-silver/60 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: NAVY }}>
              Cookbook
            </h1>
            <p className="text-silver-foreground">
              Save meals with photos once — reuse on the calendar anytime.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ImportExportMenu type="menu" importDisabled />
            <Button
              onClick={handleCreate}
              className="rounded-2xl px-6 font-bold uppercase tracking-wide"
              style={{ backgroundColor: NAVY }}
            >
              <Plus className="h-4 w-4" />
              Create Meal
            </Button>
            <button
              type="button"
              className="relative rounded-2xl p-3 text-primary transition hover:bg-silver/20"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" style={{ color: NAVY }} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-silver/60 px-3 py-2">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop"
                alt="Angela D."
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                  Angela D.
                </p>
                <p className="text-xs text-silver-foreground">Nutrition Admin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center grid */}
        <section className="flex-1 overflow-y-auto px-8 py-6">
          {/* Search & category dropdown */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search meals..."
                className="rounded-2xl border-silver/60 pl-11"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-foreground" />
              <select
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value as MealCategory | "all")
                  setPage(1)
                }}
                className="h-14 min-w-[180px] appearance-none rounded-2xl border border-silver/60 bg-white pl-11 pr-10 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ color: NAVY }}
              >
                <option value="all">All Categories</option>
                {MEAL_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cookbook tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {COOKBOOK_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.id)
                  setPage(1)
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeCategory === tab.id
                    ? "border-transparent text-white shadow-sm"
                    : "border-silver/60 bg-white text-primary hover:border-primary/30"
                )}
                style={activeCategory === tab.id ? { backgroundColor: NAVY } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="mb-5 flex flex-wrap gap-2">
            {CATEGORY_FILTER_PILLS.map((pill) => {
              const Icon = PILL_ICONS[pill.id]
              const active = activeCategory === pill.id
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(pill.id)
                    setPage(1)
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    active
                      ? "border-transparent text-white shadow-sm"
                      : "border-silver/60 bg-white text-primary hover:border-primary/30 hover:bg-silver/10"
                  )}
                  style={active ? { backgroundColor: NAVY } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {pill.label}
                </button>
              )
            })}
          </div>

          {/* Results header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: NAVY }}>
              {filteredTemplates.length} Meals Found
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-silver-foreground">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as MealSortOption)}
                  className="rounded-xl border border-silver/60 bg-white px-3 py-2 text-sm font-medium outline-none"
                  style={{ color: NAVY }}
                >
                  {MEAL_SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex rounded-xl border border-silver/60 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "grid" ? "text-white" : "text-primary hover:bg-silver/20"
                  )}
                  style={viewMode === "grid" ? { backgroundColor: NAVY } : undefined}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "list" ? "text-white" : "text-primary hover:bg-silver/20"
                  )}
                  style={viewMode === "list" ? { backgroundColor: NAVY } : undefined}
                  aria-label="List view"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Meal cards */}
          {viewMode === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedTemplates.length === 0 ? (
                <p className="col-span-full py-16 text-center text-sm text-silver-foreground">
                  No meals in this category. Create your first template.
                </p>
              ) : (
                paginatedTemplates.map((template) => {
                  const cover = getMealCoverPhoto(template.photos)
                  const selected = selectedId === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={cn(
                        "group overflow-hidden rounded-2xl border bg-white text-left transition",
                        selected
                          ? "border-primary shadow-md ring-2 ring-primary/20"
                          : "border-silver/60 hover:border-primary/40 hover:shadow-md"
                      )}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-silver/15">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-silver-foreground">
                            <ImageIcon className="h-12 w-12 opacity-30" />
                          </div>
                        )}
                        {isNewMeal(template) && (
                          <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            New
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(e, template)}
                          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white"
                          aria-label={template.isFavorite ? "Remove favorite" : "Add favorite"}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              template.isFavorite
                                ? "fill-danger text-danger"
                                : "text-silver-foreground"
                            )}
                          />
                        </button>
                      </div>
                      <div className="space-y-1 p-4">
                        <h3 className="font-bold" style={{ color: NAVY }}>
                          {template.name}
                        </h3>
                        <p className="text-xs text-silver-foreground">
                          {formatCategoryLabel(template.category)} • {formatGradeRange(template.gradeAvailability)}
                        </p>
                        <p className="text-xs text-silver-foreground">
                          {formatLastUsedLabel(template.lastUsedAt)}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTemplates.map((template) => {
                const cover = getMealCoverPhoto(template.photos)
                const selected = selectedId === template.id
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className={cn(
                      "flex w-full gap-4 overflow-hidden rounded-2xl border bg-white p-3 text-left transition hover:shadow-md",
                      selected ? "border-primary ring-2 ring-primary/20" : "border-silver/60"
                    )}
                  >
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-silver/15">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-silver-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold" style={{ color: NAVY }}>
                          {template.name}
                        </h3>
                        {isNewMeal(template) && (
                          <Badge variant="success" className="text-[10px]">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-silver-foreground">
                        {formatCategoryLabel(template.category)} • {formatGradeRange(template.gradeAvailability)}
                      </p>
                      <p className="text-xs text-silver-foreground">
                        {formatLastUsedLabel(template.lastUsedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, template)}
                      className="self-center p-2"
                    >
                      <Heart
                        className={cn(
                          "h-5 w-5",
                          template.isFavorite ? "fill-danger text-danger" : "text-silver-foreground"
                        )}
                      />
                    </button>
                  </button>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-silver/60 p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition",
                    p === page ? "text-white" : "border border-silver/60 text-primary hover:bg-silver/10"
                  )}
                  style={p === page ? { backgroundColor: NAVY } : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-silver/60 p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        {/* Right editor panel */}
        {draft && (
          <aside className="flex w-[420px] shrink-0 flex-col border-l border-silver/60 bg-white">
            <div className="flex items-start justify-between border-b border-silver/40 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: NAVY }}>
                  {draft.name || "New Meal"}
                </h2>
                {draft.isPublished && (
                  <Badge variant="success" className="mt-1 uppercase">
                    Published
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-xl p-2 text-silver-foreground transition hover:bg-silver/20 hover:text-primary"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-silver/40 px-6">
              {(
                [
                  { id: "details", label: "Details" },
                  { id: "photos", label: "Photos & Items" },
                  { id: "nutrition", label: "Nutrition" },
                  { id: "pricing", label: "Pricing" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorTab(tab.id)}
                  className={cn(
                    "border-b-2 px-3 py-3 text-sm font-semibold transition",
                    editorTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-silver-foreground hover:text-primary"
                  )}
                  style={editorTab === tab.id ? { borderColor: NAVY, color: NAVY } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {editorTab === "details" && (
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-silver-foreground">
                      Meal Information
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label>Meal Name</Label>
                        <Input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Chicken Wrap Meal"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={draft.description ?? ""}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          placeholder="Brief description for parents and staff"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Category</Label>
                          <select
                            value={draft.category}
                            onChange={(e) => {
                              const category = e.target.value as MealCategory
                              setDraft({
                                ...draft,
                                category,
                                mealType:
                                  category === "breakfast"
                                    ? "breakfast"
                                    : category === "lunch"
                                      ? "lunch"
                                      : "special",
                              })
                            }}
                            className="flex h-14 w-full rounded-2xl border border-silver/80 bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            {MEAL_CATEGORIES.filter((c) => c.id !== "archived").map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Grade Availability</Label>
                          <select
                            value={
                              draft.gradeAvailability.includes("grades_7_8") &&
                              draft.gradeAvailability.includes("grades_9_12")
                                ? "grades_7_12"
                                : draft.gradeAvailability[0] ?? "grades_7_8"
                            }
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === "grades_7_12") {
                                setDraft({
                                  ...draft,
                                  gradeAvailability: ["grades_7_8", "grades_9_12"],
                                })
                              } else {
                                setDraft({
                                  ...draft,
                                  gradeAvailability: [val as GradeAvailability],
                                })
                              }
                            }}
                            className="flex h-14 w-full rounded-2xl border border-silver/80 bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="grades_7_12">7–12</option>
                            <option value="grades_7_8">7–8</option>
                            <option value="grades_9_12">9–12</option>
                            <option value="teacher">Teachers</option>
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-silver-foreground">
                      Allergens
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {draft.allergens.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAllergen(a)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning"
                        >
                          {a}
                          <X className="h-3 w-3" />
                        </button>
                      ))}
                      <select
                        className="rounded-full border border-dashed border-silver/60 bg-white px-3 py-1.5 text-xs font-semibold text-primary"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) toggleAllergen(e.target.value)
                        }}
                      >
                        <option value="">+ Add Allergen</option>
                        {COMMON_ALLERGENS.filter((a) => !draft.allergens.includes(a)).map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-silver-foreground">
                        Photos & Composition
                      </p>
                      <button type="button" className="text-xs font-semibold text-primary hover:underline">
                        Edit Order
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {PHOTO_SLOTS.filter((s) => s.id !== "additional").map((slot) => {
                        const photo = draft.photos.find((p) => p.slot === slot.id)
                        const item = draft.items.find((_, i) => {
                          const slotOrder: MealPhotoSlot[] = ["entree", "side", "dessert", "drink"]
                          return slotOrder[i] === slot.id
                        })
                        return (
                          <div key={slot.id} className="w-20 shrink-0 text-center">
                            <div className="aspect-square overflow-hidden rounded-xl border border-silver/60 bg-silver/10">
                              {photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photo.url} alt={slot.label} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-silver-foreground/40" />
                                </div>
                              )}
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-silver-foreground">
                              {slot.label}
                            </p>
                            {item && (
                              <p className="truncate text-[10px] text-primary">{item.name}</p>
                            )}
                          </div>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => setEditorTab("photos")}
                        className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-silver/60 text-silver-foreground transition hover:border-primary/40 hover:text-primary"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="mt-1 text-[10px] font-semibold">Add Item</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={draft.portionNotes ?? ""}
                      onChange={(e) => setDraft({ ...draft, portionNotes: e.target.value })}
                      placeholder="Serving notes, prep instructions..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {currentTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-silver/25 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const tag = prompt("Add tag")
                          if (tag) addTag(tag)
                        }}
                        className="rounded-full border border-dashed border-silver/60 px-3 py-1 text-xs font-semibold text-primary hover:bg-silver/10"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {editorTab === "photos" && (
                <div className="space-y-5">
                  <div>
                    <Label>Meal Photos</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {PHOTO_SLOTS.map((slot) => {
                        const photo = draft.photos.find((p) => p.slot === slot.id)
                        const isDragging = dragSlot === slot.id
                        return (
                          <div
                            key={slot.id}
                            className={cn(
                              "relative overflow-hidden rounded-2xl border-2 border-dashed transition",
                              isDragging ? "border-success bg-success/5" : "border-silver/60"
                            )}
                            onDragOver={(e) => {
                              e.preventDefault()
                              setDragSlot(slot.id)
                            }}
                            onDragLeave={() => setDragSlot(null)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setDragSlot(null)
                              const file = e.dataTransfer.files[0]
                              if (file?.type.startsWith("image/")) handlePhotoUpload(slot.id, file)
                            }}
                          >
                            <input
                              ref={(el) => {
                                fileInputRefs.current[slot.id] = el
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handlePhotoUpload(slot.id, file)
                              }}
                            />
                            {photo ? (
                              <div className="aspect-square">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.url} alt={slot.label} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[slot.id]?.click()}
                                className="flex aspect-square w-full flex-col items-center justify-center gap-1 text-xs text-silver-foreground hover:bg-silver/10"
                              >
                                <Upload className="h-5 w-5" />
                                {slot.label}
                              </button>
                            )}
                            <p className="absolute bottom-0 left-0 right-0 bg-primary/70 px-2 py-1 text-center text-[10px] font-bold text-white">
                              {slot.label}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>Meal Composition</Label>
                      <Button size="sm" variant="outline" onClick={addCompositionItem}>
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {draft.items.map((item, index) => (
                        <Card
                          key={item.id}
                          className="flex items-center gap-2 rounded-2xl border-silver/60 p-3"
                        >
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveItem(index, -1)}
                              className="text-silver-foreground hover:text-primary disabled:opacity-30"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={index === draft.items.length - 1}
                              onClick={() => moveItem(index, 1)}
                              className="text-silver-foreground hover:text-primary disabled:opacity-30"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const items = draft.items.map((it) =>
                                it.id === item.id ? { ...it, name: e.target.value } : it
                              )
                              setDraft({ ...draft, items })
                            }}
                            className="h-10 flex-1"
                          />
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editorTab === "nutrition" && (
                <div className="space-y-4">
                  <div>
                    <Label>Nutrition Notes</Label>
                    <Textarea
                      value={draft.nutritionNotes ?? ""}
                      onChange={(e) => setDraft({ ...draft, nutritionNotes: e.target.value })}
                      placeholder="Calories, whole grains, etc."
                    />
                  </div>
                  <div>
                    <Label>Portion Notes</Label>
                    <Input
                      value={draft.portionNotes ?? ""}
                      onChange={(e) => setDraft({ ...draft, portionNotes: e.target.value })}
                      placeholder="Serving sizes"
                    />
                  </div>
                  <div>
                    <Label>Allergens</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {COMMON_ALLERGENS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAllergen(a)}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold transition",
                            draft.allergens.includes(a)
                              ? "bg-warning/20 text-warning"
                              : "bg-silver/20 text-primary hover:bg-silver/40"
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Grade Availability</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {GRADE_OPTIONS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGrade(g.id)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-medium transition",
                            draft.gradeAvailability.includes(g.id)
                              ? "border-success bg-success/10 text-success"
                              : "border-silver/60 text-primary hover:bg-silver/10"
                          )}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editorTab === "pricing" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Student Meal</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.studentMealPrice ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            studentMealPrice: parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">À La Carte</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.alaCartePrice ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            alaCartePrice: parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Staff</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.staffMealPrice ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            staffMealPrice: parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-silver/60 px-4 py-3">
                      <span className="text-sm text-primary">Favorite</span>
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, isFavorite: !draft.isFavorite })}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5",
                            draft.isFavorite ? "fill-success text-success" : "text-silver-foreground"
                          )}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-silver/60 px-4 py-3">
                      <span className="text-sm text-primary">Published</span>
                      <input
                        type="checkbox"
                        checked={draft.isPublished}
                        onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
                        className="h-5 w-5 rounded accent-success"
                      />
                    </div>
                    {selectedId && !isCreating && (
                      <Button variant="outline" className="w-full" onClick={handleArchive}>
                        <Archive className="h-4 w-4" />
                        Archive Meal
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 border-t border-silver/40 px-6 py-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 uppercase tracking-wide"
                disabled={!selectedId && !isCreating}
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 uppercase tracking-wide"
                disabled={!draft}
                onClick={() => draft && setPreviewTemplate(draft)}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                size="sm"
                className="flex-1 uppercase tracking-wide"
                style={{ backgroundColor: NAVY }}
                onClick={handleSave}
              >
                <Pencil className="h-4 w-4" />
                Edit Meal
              </Button>
            </div>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex flex-wrap items-center gap-6 border-t border-silver/60 bg-white px-8 py-3 text-xs text-silver-foreground">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: NAVY }} />
          <span>
            <strong style={{ color: NAVY }}>Total Meals:</strong> {activeTemplates.length}
          </span>
        </div>
        <div className="h-4 w-px bg-silver/60" />
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" style={{ color: NAVY }} />
          <span>
            <strong style={{ color: NAVY }}>Most Used:</strong> {mostUsed?.name ?? "—"}
          </span>
        </div>
        <div className="h-4 w-px bg-silver/60" />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" style={{ color: NAVY }} />
          <span>
            <strong style={{ color: NAVY }}>Last Updated:</strong> {lastUpdated}
          </span>
        </div>
        <div className="h-4 w-px bg-silver/60" />
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" style={{ color: NAVY }} />
          <span>
            <strong style={{ color: NAVY }}>Photo Library:</strong> {photoCount} Images
          </span>
        </div>
        <div className="h-4 w-px bg-silver/60" />
        <div className="flex min-w-[200px] flex-1 items-center gap-3">
          <span>
            <strong style={{ color: NAVY }}>Storage Used:</strong> {storageUsedGb} GB / 10 GB
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-silver/30">
            <div
              className="h-full rounded-full transition-all"
              style={{
                backgroundColor: NAVY,
                width: `${Math.min(100, (parseFloat(storageUsedGb) / 10) * 100)}%`,
              }}
            />
          </div>
        </div>
      </footer>

      {previewTemplate && (
        <MealPreviewModal
          template={previewTemplate}
          coverUrl={getMealCoverPhoto(previewTemplate.photos)}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}
