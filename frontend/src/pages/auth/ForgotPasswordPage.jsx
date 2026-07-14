import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { MapPin, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email);
    } catch {
      // Intentionally ignored: always show the generic "check your inbox" message.
    } finally {
      setSubmitted(true);
    }
  };
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-100 bg-white rounded-2xl shadow-xl p-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#475569] mb-6 transition-colors"
        >
          <ArrowLeft size={13} /> Back to sign in
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center">
            <MapPin size={15} className="text-white" />
          </div>
          <span className="font-bold text-[#0f172a] text-[15px]">
            Smart<span className="text-[#16a34a]">Nepal</span>
          </span>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={26} className="text-[#16a34a]" />
            </div>
            <h2 className="text-lg font-bold text-[#0f172a] mb-2">
              Check your inbox
            </h2>
            <p className="text-sm text-[#64748b] leading-relaxed">
              If an account exists with that email, a password reset link has
              been sent. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#0f172a] mt-4 mb-1.5">
              Forgot your password?
            </h2>
            <p className="text-sm text-[#64748b] mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email",
                  },
                })}
                className={INPUT_CLS}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white
                  font-semibold text-sm transition-all shadow-sm disabled:opacity-60
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
