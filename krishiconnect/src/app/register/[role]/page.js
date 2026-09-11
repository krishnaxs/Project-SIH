"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [location, setLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

  const roleName = role?.charAt(0).toUpperCase() + role?.slice(1);

  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const locationRef = useRef(location);
  locationRef.current = location;

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      setMessage("Authenticating with Google...");

      const currentForm = formDataRef.current;
      const currentLocation = locationRef.current;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: response.credential,
          role,
          phone: currentForm.phone ? `+91${currentForm.phone}` : undefined,
          location: currentLocation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Google authentication failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage(data.message || "Signed in with Google successfully!");

      setTimeout(() => {
        router.push(`/${data.user.role}/dashboard`);
      }, 800);
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

  // Initialize Google Identity Services SDK
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
      setMessage("Google Sign-In is initializing. Please try again.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Indian phone number handling: strictly 10 digits starting with 6, 7, 8, 9
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // digits only

    if (val.length > 0 && !["6", "7", "8", "9"].includes(val[0])) {
      setMessage("Mobile number must start with 6, 7, 8, or 9.");
      return;
    }

    if (val.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: val }));
      if (val.length === 10) {
        setMessage("");
      }
    }
  };

  // Capture Location & Reverse Geocode to real human-readable address
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setMessage("Detecting GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMessage("Resolving address from coordinates...");

        try {
          const res = await fetch(
            `/api/location/reverse?lat=${latitude}&lng=${longitude}`
          );
          const geoData = await res.json();
          let resolvedAddress = geoData.address || "";

          if (!resolvedAddress || resolvedAddress.startsWith("Current Location")) {
            try {
              const bdc = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              if (bdc.ok) {
                const bdcData = await bdc.json();
                const parts = [
                  bdcData.locality,
                  bdcData.city !== bdcData.locality ? bdcData.city : null,
                  bdcData.principalSubdivision,
                  bdcData.countryName,
                ].filter(Boolean);
                if (parts.length > 0) {
                  resolvedAddress = parts.join(", ");
                }
              }
            } catch {}
          }

          setLocation({
            latitude,
            longitude,
            address:
              resolvedAddress || "Current Location (Please enter your address)",
            city: geoData.city || "",
            state: geoData.state || "",
            pincode: geoData.postcode || "",
          });

          setMessage("Location and address captured successfully!");
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          let clientResolved = "";
          try {
            const bdc = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (bdc.ok) {
              const bdcData = await bdc.json();
              const parts = [
                bdcData.locality,
                bdcData.city !== bdcData.locality ? bdcData.city : null,
                bdcData.principalSubdivision,
                bdcData.countryName,
              ].filter(Boolean);
              if (parts.length > 0) clientResolved = parts.join(", ");
            }
          } catch {}

          setLocation({
            latitude,
            longitude,
            address:
              clientResolved || "Current Location (Please enter your address)",
          });
          setMessage("Location captured. Please refine your street address below.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        setMessage(
          "Location permission was denied. Please allow location access in your browser."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      setMessage("Please capture your location before registering.");
      return;
    }

    // Phone validation
    const cleanPhone = formData.phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setMessage(
        "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage(
        "Passwords do not match. Please re-enter your password in Confirm Password."
      );
      return;
    }

    const fullPhone = `+91${cleanPhone}`;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: fullPhone,
          role,
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Registration successful!");

      setTimeout(() => {
        router.push(`/${data.user.role}/dashboard`);
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Home
        </button>

        <div className="mb-8">
          <div className="mb-3 text-4xl">
            {role === "farmer"
              ? "🌾"
              : role === "buyer"
              ? "🛒"
              : role === "logistics"
              ? "🚛"
              : "👤"}
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Register as {roleName}
          </h1>

          <p className="mt-2 text-slate-600">
            Create your KrishiConnect account.
          </p>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="mb-6 flex w-full flex-col items-center">
          <div ref={googleBtnRef} className="flex justify-center w-full min-h-[44px]"></div>
          {!isGoogleReady && (
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-full border-t border-slate-200"></div>
          <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            or with details
          </span>
          <div className="w-full border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Email Address */}
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
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Phone Number with +91 Badge */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Phone Number
            </label>

            <div className="relative flex overflow-hidden rounded-lg border border-slate-300 transition focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100">
              <span className="inline-flex select-none items-center border-r border-slate-300 bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                placeholder="10-digit number (e.g. 9876543210)"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={10}
                required
                className="w-full px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Must start with 6, 7, 8, or 9 and be exactly 10 digits.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Capture Location Button */}
          <button
            type="button"
            onClick={captureLocation}
            disabled={detectingLocation}
            className="w-full rounded-lg border border-green-700 px-4 py-3 font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {detectingLocation ? "📍 Detecting Address..." : "📍 Capture My Location"}
          </button>

          {/* Address Display Card */}
          {location && (
            <div className="space-y-3 rounded-xl border border-green-200 bg-green-50/70 p-4 text-sm text-green-900">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">📍</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    Detected Address:
                  </p>
                  <p className="mt-1 font-medium leading-relaxed text-slate-800">
                    {location.address}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Edit / Fine-tune your address (House no., Landmark, Street):
                </label>
                <textarea
                  rows={2}
                  value={location.address}
                  onChange={(e) =>
                    setLocation((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-green-300 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-200"
                  placeholder="e.g. Near Shiv Temple, Main Road"
                />
              </div>

              <div className="flex items-center gap-1.5 border-t border-green-200/60 pt-1.5 text-xs text-green-700">
                <span>✓ Address captured via GPS</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || detectingLocation}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="mt-5 text-center text-sm font-medium text-slate-700">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-semibold text-green-700 hover:text-green-800"
          >
            Login
          </button>
        </p>

        {/* GOOGLE SETUP MODAL (IF CLIENT ID NOT CONFIGURED) */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900">
                Google Authentication Setup
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                To enable live Google Sign-In, please add your Google OAuth Client ID to your environment variables:
              </p>
              <div className="mt-3 rounded-lg bg-slate-100 p-3 text-xs font-mono text-slate-800">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-slate-600">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-green-700 underline">Google Cloud Console</a>.</li>
                <li>Create an OAuth 2.0 Client ID for Web application.</li>
                <li>Add your Vercel URL to Authorized JavaScript origins.</li>
                <li>Add <code className="bg-slate-100 px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to Vercel Settings.</li>
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
