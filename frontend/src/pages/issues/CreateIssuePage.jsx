import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  MapPin,
  AlertCircle,
  Send,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import useIssueStore from "../../store/useIssueStore.js";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
} from "../../constants/issue.js";
import ImageUploader from "../../components/issues/ImageUploader.jsx";
import LocationPicker from "../../components/map/LocationPicker.jsx";
import {
  fetchAISuggestion,
  generateTitleRequest,
  checkDuplicatesRequest,
} from "../../services/aiService.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { STATUS_CONFIG } from "../../constants/issue.js";

const STEP_LABELS = ["Details", "Photo", "Location"];

// ── Step indicator 
function StepIndicator({ step }) {
  return (
    <div className="px-8 pt-7 pb-6 border-b border-[#f1f5f9]">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const cur = step === n;
          return (
            <div
              key={label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs fontshrink-0 transition-all duration-300
                  ${
                    done
                      ? "bg-[#16a34a] text-white"
                      : cur
                        ? "bg-[#16a34a] text-white ring-4 ring-[#16a34a]/15"
                        : "bg-[#e2e8f0] text-[#94a3b8]"
                  }`}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : n}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium whitespace-nowrap
                  transition-colors
                  ${
                    cur
                      ? "text-[#16a34a] font-semibold"
                      : done
                        ? "text-[#16a34a]"
                        : "text-[#94a3b8]"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all
                  duration-300
                  ${step > n ? "bg-[#16a34a]" : "bg-[#e2e8f0]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Success state 
function SuccessState({ issueId, onReportAnother }) {
  const navigate = useNavigate();
  return (
    <div className="p-12 text-center">
      <div
        className="w-20 h-20 rounded-full bg-green-100 flex items-center
        justify-center mx-auto mb-6 border-4 border-[#f0fdf4]"
      >
        <CheckCircle size={38} className="text-[#16a34a]" fill="#16a34a" />
      </div>
      <h2 className="text-2xl font-bold text-[#16a34a] mb-3">
        Issue Reported!
      </h2>
      <p className="text-base text-[#0f172a] mb-1.5">
        Your report has been submitted successfully.
      </p>
      <p className="text-sm text-[#94a3b8] mb-8 leading-relaxed">
        The municipality will review it within 48 hours. Our AI has already
        categorized and prioritized it to speed up triage.
      </p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <button
          onClick={() => navigate(`/issues/${issueId}`)}
          className="h-11 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white
            font-semibold text-sm transition-colors shadow-sm"
        >
          View My Report
        </button>
        <button
          onClick={onReportAnother}
          className="h-11 rounded-xl border border-[#e2e8f0] text-[#475569]
            font-medium text-sm hover:bg-[#f8fafc] transition-colors"
        >
          Report Another Issue
        </button>
      </div>
    </div>
  );
}

// ── AI Suggestion Banner 
function AISuggestionBanner({ suggestion, onApply, onDismiss }) {
  const pr = PRIORITY_CONFIG[suggestion.priority] || PRIORITY_CONFIG.low;
  return (
    <div
      className="bg-violet-50 border border-violet-100 rounded-xl p-4
      flex items-start gap-3 mt-3"
    >
      <Sparkles size={15} className="text-violet-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold text-violet-700">AI suggests:</p>
          <span
            className="text-[10px] font-semibold text-violet-500 bg-violet-100
            px-2 py-0.5 rounded-full"
          >
            {suggestion.confidence}% confidence
          </span>
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="inline-flex items-center text-xs font-semibold px-2.5 py-1
            rounded-full bg-white border border-violet-200 text-[#0f172a]"
          >
            {suggestion.category}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold
            px-2.5 py-1 rounded-full"
            style={{ backgroundColor: pr.bg, color: pr.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: pr.color }}
            />
            {pr.label} Priority
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApply}
            className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-700
              text-white text-xs font-semibold transition-colors"
          >
            Apply suggestion
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="h-7 px-2 text-xs text-violet-400 hover:text-violet-600
              transition-colors"
          >
            Keep my selection
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-violet-300 hover:text-violet-500 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Duplicate Warning Banner
function DuplicateWarningBanner({ duplicates, onDismiss }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle
          size={16}
          className="text-ambershrink-0 mt-0.5"
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800">
            Possible duplicate{duplicates.length > 1 ? "s" : ""} detected
          </p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            AI found {duplicates.length} similar report
            {duplicates.length > 1 ? "s" : ""} in this area. Check if your issue
            is already being tracked before submitting.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* List of suspected duplicates */}
      <div className="space-y-2 mb-3">
        {duplicates.map((dup) => {
          const st = STATUS_CONFIG[dup.status] || STATUS_CONFIG.open;
          return (
            <div
              key={dup._id}
              className="flex items-start gap-3 bg-white rounded-lg px-3 py-2.5
                border border-amber-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0f172a] line-clamp-1">
                  {dup.title}
                </p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">
                  {dup.reason}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Similarity score badge */}
                <span
                  className="text-[10px] font-bold text-amber-700 bg-amber-100
                  px-2 py-0.5 rounded-full"
                >
                  {dup.similarity}% match
                </span>
                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  text-[10px] font-semibold"
                  style={{ backgroundColor: st.bg, color: st.text }}
                >
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: st.dot }}
                  />
                  {st.label}
                </span>
                {/* Open in new tab */}
                <Link
                  to={`/issues/${dup._id}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#16a34a] hover:text-[#15803d] transition-colors"
                  title="Open issue"
                >
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-amber-600">
        You can still submit your report — duplicate resolution helps the
        municipality prioritize.
      </p>
    </div>
  );
}

// ── Step 1: Details 
function Step1({ onNext, formMethods }) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = formMethods;

  const category = watch("category");
  const description = watch("description", "");
  const title = watch("title", "");

  // Debounce for auto AI suggestion on description
  const debouncedDescription = useDebounce(description, 900);

  // AI categorization state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  // AI title generation state
  const [titleLoading, setTitleLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState(null);

  // useCallback to avoid dependency warnings and hoisting issues
  const fetchSuggestion = useCallback(async (currentTitle, currentDescription) => {
    setAiLoading(true);
    try {
      const res = await fetchAISuggestion({ title: currentTitle, description: currentDescription });
      if (res.success && res.suggestion) setAiSuggestion(res.suggestion);
    } catch {
      // Silent failure
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Auto-fetch AI suggestion when description is long enough
  useEffect(() => {
    if (
      debouncedDescription.length >= 50 &&
      !aiLoading &&
      !aiSuggestion &&
      !aiDismissed
    ) {
      const handle = setTimeout(() => {
        fetchSuggestion(title, debouncedDescription);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [debouncedDescription, aiLoading, aiSuggestion, aiDismissed, title, fetchSuggestion]);

  // Reset dismissed state if description is significantly shortened
  useEffect(() => {
    if (aiDismissed && debouncedDescription.length < 30) {
      const handle = setTimeout(() => {
        setAiDismissed(false);
        setAiSuggestion(null);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [debouncedDescription, aiDismissed]);

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    setValue("category", aiSuggestion.category, { shouldValidate: true });
    setValue("priority", aiSuggestion.priority);
    setAiApplied(true);
    setAiSuggestion(null);
    toast.success("AI suggestion applied — you can still change it below");
  };

  // ── Phase 13: AI title generation
  const handleGenerateTitle = async () => {
    if (description.trim().length < 20) {
      toast.error("Write a description first (at least 20 characters)");
      return;
    }
    setTitleLoading(true);
    setAiTitle(null);
    try {
      const res = await generateTitleRequest({
        description,
        category: category || "",
      });
      if (res.success && res.title) {
        setAiTitle(res.title);
      } else {
        toast.error("Could not generate a title right now");
      }
    } catch {
      toast.error("Title generation failed. Please try again.");
    } finally {
      setTitleLoading(false);
    }
  };

  const applyAITitle = () => {
    if (!aiTitle) return;
    setValue("title", aiTitle);
    setAiTitle(null);
    toast.success("AI title applied");
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0f172a] mb-1">
        Report an Issue
      </h2>
      <p className="text-sm text-[#94a3b8] mb-6">Step 1 of 3: Issue details</p>

      {/* Title */}
      <div className="mb-4">
        <label
          className="block text-xs font-semibold uppercase tracking-wider
          text-[#475569] mb-2"
        >
          Issue Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Briefly describe the issue"
          {...register("title", {
            required: "Title is required",
            maxLength: { value: 100, message: "Max 100 characters" },
          })}
          className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm
            text-[#0f172a] placeholder:text-[#94a3b8] outline-none
            focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15
            transition-all"
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
        )}

        {/* AI title generation trigger */}
        <button
          type="button"
          onClick={handleGenerateTitle}
          disabled={titleLoading}
          className="flex items-center gap-1.5 mt-2 text-xs font-medium
            text-violet-600 hover:text-violet-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {titleLoading ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Generating title…
            </>
          ) : (
            <>
              <Sparkles size={11} /> Generate title with AI
            </>
          )}
        </button>

        {/* AI title suggestion box — Phase 13 */}
        {aiTitle && (
          <div
            className="mt-2 bg-violet-50 border border-violet-100 rounded-xl p-3.5
            flex items-start gap-3"
          >
            <Sparkles
              size={13}
              className="text-violet-600 shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-violet-700 mb-1.5">
                AI-generated title:
              </p>
              <p className="text-sm text-[#0f172a] mb-3 leading-snug font-medium">
                {aiTitle}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyAITitle}
                  className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-700
                    text-white text-xs font-semibold transition-colors"
                >
                  Use this title
                </button>
                <button
                  type="button"
                  onClick={() => setAiTitle(null)}
                  className="h-7 px-2 text-xs text-violet-400 hover:text-violet-600
                    transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category icon grid */}
      <div className="mb-4">
        <label
          className="block text-xs font-semibold uppercase tracking-wider
          text-[#475569] mb-2"
        >
          Category <span className="text-red-500">*</span>
          {aiApplied && (
            <span
              className="ml-2 text-[10px] font-semibold text-violet-600
              bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100
              lowercase tracking-normal"
            >
              ✦ AI applied
            </span>
          )}
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || AlertCircle;
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setValue("category", cat, { shouldValidate: true })
                }
                className="flex flex-col items-center justify-center gap-1.5
                  rounded-xl border-2 text-center transition-all"
                style={{
                  height: 68,
                  borderColor: active ? "#16a34a" : "#e2e8f0",
                  backgroundColor: active ? "#f0fdf4" : "white",
                }}
              >
                <Icon
                  size={18}
                  style={{ color: active ? "#16a34a" : cfg.color }}
                />
                <span
                  className={`text-[9px] font-semibold leading-tight
                  ${active ? "text-[#16a34a]" : "text-[#64748b]"}`}
                >
                  {cat.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
        <input
          type="hidden"
          {...register("category", { required: "Please select a category" })}
        />
        {errors.category && (
          <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Priority */}
      <div className="mb-4">
        <label
          className="block text-xs font-semibold uppercase tracking-wider
          text-[#475569] mb-2"
        >
          Priority Level
          {aiApplied && (
            <span
              className="ml-2 text-[10px] font-semibold text-violet-600
              bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100
              lowercase tracking-normal"
            >
              ✦ AI applied
            </span>
          )}
        </label>
        <div className="relative">
          <select
            {...register("priority")}
            className="w-full h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0]
              text-sm text-[#0f172a] outline-none focus:border-[#16a34a] bg-white
              appearance-none cursor-pointer transition-all"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
          <ChevronRight
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90
            text-[#94a3b8] pointer-events-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-2">
        <label
          className="block text-xs font-semibold uppercase tracking-wider
          text-[#475569] mb-2"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Describe the issue in detail. What did you see? How long has it been there? Who is affected?"
          {...register("description", {
            required: "Description is required",
            minLength: { value: 10, message: "At least 10 characters" },
          })}
          className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm
            placeholder:text-[#94a3b8] text-[#0f172a] outline-none
            focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15
            transition-all resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          ) : (
            <p className="text-[10px] text-[#94a3b8]">
              {description.length >= 50
                ? "✓ Enough detail for AI analysis"
                : `${50 - description.length} more characters to enable AI suggestions`}
            </p>
          )}
          <p className="text-[10px] text-[#94a3b8]">{description.length}</p>
        </div>
      </div>

      {/* AI loading */}
      {aiLoading && (
        <div
          className="flex items-center gap-2 bg-violet-50 border border-violet-100
          rounded-xl px-4 py-3 mt-2"
        >
          <Loader2
            size={14}
            className="text-violet-500 animate-spin shrink-0"
          />
          <p className="text-xs font-medium text-violet-600">
            Analysing your report with AI…
          </p>
        </div>
      )}

      {/* AI suggestion banner */}
      {aiSuggestion && !aiLoading && (
        <AISuggestionBanner
          suggestion={aiSuggestion}
          onApply={applyAISuggestion}
          onDismiss={() => {
            setAiDismissed(true);
            setAiSuggestion(null);
          }}
        />
      )}

      {/* Applied confirmation */}
      {aiApplied && (
        <div
          className="flex items-center gap-2 bg-violet-50 border border-violet-100
          rounded-xl px-4 py-2.5 mt-2"
        >
          <Sparkles size={13} className="text-violet-500 shrink-0" />
          <p className="text-xs text-violet-600 font-medium">
            AI suggestion applied — you can still adjust the fields above.
          </p>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a]
            hover:bg-[#15803d] text-white font-semibold text-sm
            transition-all shadow-sm"
        >
          Next: Add Photo <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Photo 
function Step2({ onNext, onBack, imageFiles, setImageFiles }) {
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0f172a] mb-1">Add a photo</h2>
      <p className="text-sm text-[#94a3b8] mb-6">
        A clear photo helps authorities assess the issue faster.
      </p>

      <ImageUploader files={imageFiles} onFilesChange={setImageFiles} />

      {/* Guidelines */}
      <div className="border border-[#e2e8f0] rounded-xl mb-4 mt-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setGuidelinesOpen(!guidelinesOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm
            font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
        >
          <span>Photo guidelines</span>
          <ChevronRight
            size={14}
            className={`text-[#94a3b8] transition-transform duration-200
            ${guidelinesOpen ? "rotate-90" : ""}`}
          />
        </button>
        {guidelinesOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-[#f1f5f9] bg-[#f8fafc]">
            <ul className="space-y-2">
              {[
                "Capture the full extent of the issue in frame",
                "Ensure good lighting — avoid backlit or blurry shots",
                "Include nearby context like a street sign or landmark",
                "Avoid capturing people's faces in your photo",
                "Landscape orientation works best for street-level issues",
              ].map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-xs text-[#64748b]"
                >
                  <Check
                    size={11}
                    className="text-[#16a34a] mt-0.5 shrink-0"
                    strokeWidth={3}
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-xs text-[#94a3b8] mb-6">
        Photo is recommended but not required to submit.
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 h-11 px-5 rounded-xl border
            border-[#e2e8f0] text-[#475569] font-medium text-sm
            hover:bg-[#f8fafc] transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a]
            hover:bg-[#15803d] text-white font-semibold text-sm
            transition-all shadow-sm"
        >
          Next: Set Location <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Location + Duplicate check 
function Step3({
  onSubmit,
  onBack,
  isLoading,
  location,
  setLocation,
  formMethods,
}) {
  const { getValues } = formMethods;

  // Duplicate detection state
  const [dupLoading, setDupLoading] = useState(false);
  const [duplicates, setDuplicates] = useState(null); // null = not checked yet
  const [dupDismissed, setDupDismissed] = useState(false);

  const runDuplicateCheck = useCallback(async (currentLocation) => {
    const { title, description, category } = getValues();

    // Need at least category for the heuristic query to be useful.
    if (!category) return;

    setDupLoading(true);
    try {
      const res = await checkDuplicatesRequest({
        title: title || "",
        description: description || "",
        category,
        lat: currentLocation?.lat,
        lng: currentLocation?.lng,
      });
      // Set to empty array (not null) so we know the check ran.
      setDuplicates(res.duplicates ?? []);
    } catch {
      // Silent failure — duplicate detection is optional
      setDuplicates([]);
    } finally {
      setDupLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    if (location && !dupLoading && duplicates === null && !dupDismissed) {
      const handle = setTimeout(() => {
        runDuplicateCheck(location);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [location, dupLoading, duplicates, dupDismissed, runDuplicateCheck]);

  // When the user changes the location pin, re-run the duplicate check.
  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    setDuplicates(null); // Reset so useEffect triggers again
    setDupDismissed(false);
  };

  const hasDuplicates = Array.isArray(duplicates) && duplicates.length > 0;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0f172a] mb-1 flex items-center gap-2">
        <MapPin size={22} className="text-[#16a34a]" /> Set the location
      </h2>
      <p className="text-sm text-[#94a3b8] mb-5">
        Tap the map where the issue is located.
      </p>

      <LocationPicker
        onLocationChange={handleLocationChange}
        initialPosition={null}
      />

      {/* Location status */}
      {location ? (
        <div
          className="flex items-center gap-2.5 p-3.5 bg-green-50 border
          border-green-100 rounded-xl mt-3"
        >
          <CheckCircle size={16} className="text-[#16a34a] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#16a34a]">
              Location pinned
            </p>
            {location.address && (
              <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">
                {location.address}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 p-3.5 bg-amber-50 border
          border-amber-100 rounded-xl mt-3"
        >
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-600">
            Please set a location on the map above
          </p>
        </div>
      )}

      {location && (
        <div className="mt-4">
          {dupLoading ? (
            <div
              className="flex items-center gap-2.5 bg-[#f8fafc] border
              border-[#e2e8f0] rounded-xl px-4 py-3"
            >
              <Loader2
                size={14}
                className="text-[#94a3b8] animate-spin shrink-0"
              />
              <p className="text-xs text-[#94a3b8] font-medium">
                Checking for similar reports in the area…
              </p>
            </div>
          ) : hasDuplicates && !dupDismissed ? (
            <DuplicateWarningBanner
              duplicates={duplicates}
              onDismiss={() => setDupDismissed(true)}
            />
          ) : Array.isArray(duplicates) && duplicates.length === 0 ? (
            // All-clear: tiny note so the user knows the check ran
            <div className="flex items-center gap-2 text-[10px] text-[#94a3b8] mt-1">
              <CheckCircle size={11} className="text-[#16a34a]" />
              No similar issues found in this area — this appears to be a new
              report.
            </div>
          ) : null}
        </div>
      )}

      {/* Manual re-check button — shown after dismissal or if user wants to recheck */}
      {location && dupDismissed && (
        <button
          type="button"
          onClick={() => {
            setDuplicates(null);
            setDupDismissed(false);
            runDuplicateCheck();
          }}
          className="flex items-center gap-1.5 mt-2 text-xs font-medium
            text-[#94a3b8] hover:text-[#475569] transition-colors"
        >
          <Sparkles size={11} /> Re-run duplicate check
        </button>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 h-11 px-5 rounded-xl border
            border-[#e2e8f0] text-[#475569] font-medium text-sm
            hover:bg-[#f8fafc] transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!location || isLoading}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a]
            hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-semibold text-sm transition-all shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Submitting…
            </>
          ) : hasDuplicates && !dupDismissed ? (
            // When duplicates are showing, make it clear the user is choosing to proceed
            <>
              <AlertTriangle size={14} /> Submit anyway
            </>
          ) : (
            <>
              <Send size={14} /> Submit Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main page 
export default function CreateIssuePage() {
  const { createIssue, isLoading } = useIssueStore();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [location, setLocation] = useState(null);

  const formMethods = useForm({ defaultValues: { priority: "low" } });
  const { getValues } = formMethods;

  const handleSubmit = async () => {
    const data = getValues();
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || "low",
      address: location?.address || "",
      lat: location?.lat,
      lng: location?.lng,
      images: imageFiles,
    };
    try {
      const res = await createIssue(payload);
      setCreatedId(res.issue._id);
      setSubmitted(true);
      toast.success("Report submitted successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit. Try again.",
      );
    }
  };

  const resetForm = () => {
    setStep(1);
    setSubmitted(false);
    setCreatedId(null);
    setImageFiles([]);
    setLocation(null);
    formMethods.reset({ priority: "low" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex items-start justify-center min-h-[calc(100vh-64px)] p-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-160 overflow-hidden">
          {!submitted && <StepIndicator step={step} />}

          {submitted ? (
            <SuccessState issueId={createdId} onReportAnother={resetForm} />
          ) : step === 1 ? (
            <Step1 onNext={() => setStep(2)} formMethods={formMethods} />
          ) : step === 2 ? (
            <Step2
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              imageFiles={imageFiles}
              setImageFiles={setImageFiles}
            />
          ) : (
            <Step3
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              location={location}
              setLocation={setLocation}
              formMethods={formMethods}
            />
          )}
        </div>
      </div>
    </div>
  );
}
