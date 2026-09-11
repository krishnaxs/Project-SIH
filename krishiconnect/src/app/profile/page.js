"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Change password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Show / Hide Change Password preference
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Handle password input changes
  const handlePasswordChange = (e) => {
    setPasswordData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );

      setPasswordSaving(false);
      return;
    }

    // Validate password match
    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setPasswordError("New passwords do not match.");

      setPasswordSaving(false);
      return;
    }

    // Prevent same password
    if (
      passwordData.currentPassword ===
      passwordData.newPassword
    ) {
      setPasswordError(
        "New password must be different from the current password."
      );

      setPasswordSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Token expired / invalid
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          router.push("/login");
          return;
        }

        setPasswordError(
          data.message || "Failed to change password."
        );

        return;
      }

      // Clear fields after successful password change
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage(
        "Password changed successfully."
      );
    } catch (error) {
      console.error(error);

      setPasswordError(
        "Something went wrong. Please try again."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // Load profile
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Load saved Change Password preference
    const user = localStorage.getItem("user");

    if (user) {
      try {
        const parsedUser = JSON.parse(user);

        if (parsedUser?.id) {
          const savedPreference = localStorage.getItem(
            `showChangePassword_${parsedUser.id}`
          );

          if (savedPreference !== null) {
            setShowChangePassword(
              savedPreference === "true"
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to read saved preference:",
          error
        );
      }
    }

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            router.push("/login");
            return;
          }

          throw new Error(
            data.message || "Failed to load profile."
          );
        }

        const user = data.user;

        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.location?.address || "",
        });

        setRole(user.role || "");
      } catch (err) {
        console.error(err);

        setError(
          err.message || "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // Handle profile inputs
  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

    setMessage("");
    setError("");
  };

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          router.push("/login");
          return;
        }

        setError(
          data.message || "Failed to update profile."
        );

        return;
      }

      // Update form with returned database values
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        address: data.user.location?.address || "",
      });

      // Update stored user information
      const existingUser = localStorage.getItem("user");

      if (existingUser) {
        try {
          const parsedUser = JSON.parse(existingUser);

          const updatedUser = {
            ...parsedUser,
            ...data.user,
          };

          localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );
        } catch (error) {
          console.error(
            "Failed to update stored user:",
            error
          );

          localStorage.setItem(
            "user",
            JSON.stringify(data.user)
          );
        }
      } else {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Back to dashboard
  const goBack = () => {
    if (role) {
      router.push(`/${role}/dashboard`);
    } else {
      router.push("/");
    }
  };

  // Show / hide Change Password section
  const toggleChangePassword = () => {
    const newValue = !showChangePassword;

    setShowChangePassword(newValue);

    // Save preference for this specific user
    const user = localStorage.getItem("user");

    if (user) {
      try {
        const parsedUser = JSON.parse(user);

        if (parsedUser?.id) {
          localStorage.setItem(
            `showChangePassword_${parsedUser.id}`,
            String(newValue)
          );
        }
      } catch (error) {
        console.error(
          "Failed to save password preference:",
          error
        );
      }
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-slate-600">
          Loading profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        {/* Back Button */}
        <button
          onClick={goBack}
          className="mb-6 font-semibold text-green-700 transition hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

          {/* Profile Header */}
          <div className="bg-green-900 px-8 py-8 text-white">
            <div className="flex items-center gap-5">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
                👤
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-green-200">
                  {role || "User"} Profile
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Edit Profile
                </h1>

                <p className="mt-2 text-green-100">
                  Keep your KrishiConnect account information up to date.
                </p>
              </div>

            </div>
          </div>

          {/* =========================
              PERSONAL INFORMATION
              ========================= */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your basic account information.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Address
              </label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={4}
                placeholder="Enter your address"
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Success Message */}
            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={toggleChangePassword}
                className="mt-5 rounded-lg border border-green-600 px-5 py-3 font-semibold text-green-700 transition hover:bg-green-50"
              >
                {showChangePassword
                  ? "Hide Change Password"
                  : "Show Change Password"}
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>

          {showChangePassword && (
            <div className="border-t border-slate-200 px-8 py-8">

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Change Password
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Update your account password securely.
                </p>
              </div>

              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-6"
              >

                {/* Current Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Current Password
                  </label>

                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>

                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    At least 6 characters.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Success */}
                {passwordMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {passwordMessage}
                  </div>
                )}

                {/* Error */}
                {passwordError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {passwordError}
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passwordSaving
                      ? "Changing Password..."
                      : "Change Password"}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}