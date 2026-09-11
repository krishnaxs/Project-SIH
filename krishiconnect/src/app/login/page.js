"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      setMessage("Authenticating with Google...");

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: response.credential,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Google authentication failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful with Google!");

      setTimeout(() => {
        router.push(`/${data.user.role}/dashboard`);
      }, 600);
    } catch (err) {
      console.error(err);
      setMessage("An error occurred during Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "878898139545-e41duhsbc5u7ab2dm9q7ivh1bvblrev7.apps.googleusercontent.com";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: "360",
            logo_alignment: "left",
          });
          setIsGoogleReady(true);
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setShowGoogleModal(true);
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful!");

      setTimeout(() => {
        router.push(`/${data.user.role}/dashboard`);
      }, 600);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Home
        </button>

        <div className="mb-6">
          <div className="mb-3 text-4xl">🌱</div>

          <h1 className="text-3xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-slate-600">
            Login to your KrishiConnect account.
          </p>
        </div>

        {/* Continue with Google */}
        <div className="mb-6 flex w-full flex-col items-center">
          <div ref={googleBtnRef} className="flex justify-center w-full min-h-[44px]"></div>
          {!isGoogleReady && (
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-full border-t border-slate-200"></div>
          <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            or with email
          </span>
          <div className="w-full border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400 "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {message && (
          <div
            className={`mt-5 rounded-lg p-3.5 text-center text-sm font-medium ${
              message.toLowerCase().includes("successful")
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p>{message}</p>
            {message.toLowerCase().includes("register yourself") && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-1 font-semibold text-green-800 underline underline-offset-2 hover:text-green-900"
                >
                  Register Now →
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/")}
            className="font-semibold text-green-700 hover:text-green-800"
          >
            Register
          </button>
        </p>

        {/* Google Setup Instructions Modal */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900">
                Google Authentication Setup
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                To enable Google Sign-In, please configure your Google OAuth Client ID in your environment variables:
              </p>
              <div className="mt-3 rounded-lg bg-slate-100 p-3 text-xs font-mono text-slate-800 break-all">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-slate-600">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-green-700 underline">Google Cloud Console</a>.</li>
                <li>Create an OAuth 2.0 Client ID for Web Application.</li>
                <li>Add <code className="bg-slate-100 px-1 font-mono">http://localhost:3000</code> and your production URL to Authorized JavaScript origins.</li>
                <li>Add <code className="bg-slate-100 px-1 font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code className="bg-slate-100 px-1 font-mono">.env.local</code> and Vercel.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="mt-5 w-full rounded-lg bg-green-700 py-2.5 font-semibold text-white hover:bg-green-800"
              >
                Got it
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}