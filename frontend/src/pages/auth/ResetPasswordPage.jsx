import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";
const INPUT_ERROR_CLS = INPUT_CLS.replace("border-[#e2e8f0]", "border-red-300");

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ password }) => {
    setApiError("");
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success("Password reset successfully");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
          "This reset link is invalid or has expired.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-100 bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center">
            <MapPin size={15} className="text-white" />
          </div>
          <span className="font-bold text-[#0f172a] text-[15px]">
            Smart<span className="text-[#16a34a]">Nepal</span>
          </span>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={26} className="text-[#16a34a]" />
            </div>
            <h2 className="text-lg font-bold text-[#0f172a] mb-2">
              Password reset
            </h2>
            <p className="text-sm text-[#64748b]">
              Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#0f172a] mb-1.5">
              Set a new password
            </h2>
            <p className="text-sm text-[#64748b] mb-6">
              Choose a strong password for your account.
            </p>

            {apiError && (
              <div className="flex items-start gap-3 p-3.5 mb-5 rounded-lg bg-red-50 border-l-4 border-red-500">
                <AlertCircle
                  size={16}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-700 leading-snug">{apiError}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Minimum 6 characters" },
                    })}
                    className={`${errors.password ? INPUT_ERROR_CLS : INPUT_CLS} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Confirm new password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (v) =>
                      v === getValues("password") || "Passwords do not match",
                  })}
                  className={
                    errors.confirmPassword ? INPUT_ERROR_CLS : INPUT_CLS
                  }
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white
                  font-semibold text-sm transition-all shadow-sm disabled:opacity-60
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </form>

            <p className="text-sm text-[#64748b] text-center mt-5">
              <Link
                to="/forgot-password"
                className="text-[#16a34a] hover:underline font-medium"
              >
                Request a new link
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
