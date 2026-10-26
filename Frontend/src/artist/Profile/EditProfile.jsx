import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import { BASE_URL } from "../../config/api";

const EditProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [artist, setArtist] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [savingPassword, setSavingPassword] =
    useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [form, setForm] = useState({
    name: "",
    bio: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [showPassword, setShowPassword] =
    useState({
      current: false,
      new: false,
      confirm: false,
    });

  const token = localStorage.getItem("token");

  // =====================================================
  // AUTH CONFIG
  // =====================================================
  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =====================================================
  // GET IMAGE URL
  // =====================================================
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "/image/default-cover.jpg";
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    return `${BASE_URL}/${imagePath.replace(
      /^\/+/,
      ""
    )}`;
  };

  // =====================================================
  // FETCH PROFILE
  // =====================================================
  useEffect(() => {
    const fetchArtistProfile = async () => {
      try {
        setLoading(true);

        if (!token) {
          navigate("/signin", {
            replace: true,
          });
          return;
        }

        console.log(
          "FETCHING ARTIST PROFILE:",
          `${BASE_URL}/api/artists/me`
        );

        const response = await axios.get(
          `${BASE_URL}/api/artists/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "ARTIST PROFILE RESPONSE:",
          response.data
        );

        const data =
          response.data?.artist ||
          response.data;

        if (!data) {
          throw new Error(
            "Artist profile data is missing"
          );
        }

        setArtist(data);

        setForm({
          name: data.name || "",
          bio: data.bio || "",
        });

        if (data.image) {
          setPreview(
            getImageUrl(data.image)
          );
        }
      } catch (error) {
        console.error(
          "FETCH ARTIST PROFILE ERROR:",
          error
        );

        console.error(
          "SERVER RESPONSE:",
          error.response?.data
        );

        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Unable to load artist profile.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArtistProfile();
  }, [navigate, token]);

  // =====================================================
  // FORM CHANGE
  // =====================================================
  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================
  const handleImageChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      !selectedFile.type.startsWith("image/")
    ) {
      setMessage({
        type: "error",
        text: "Please select a valid image.",
      });

      return;
    }

    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      setMessage({
        type: "error",
        text: "Image must be smaller than 5MB.",
      });

      return;
    }

    setImage(selectedFile);

    const objectUrl =
      URL.createObjectURL(selectedFile);

    setPreview(objectUrl);

    setMessage({
      type: "",
      text: "",
    });
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage({
        type: "error",
        text: "Artist name is required.",
      });

      return;
    }

    try {
      setSavingProfile(true);

      setMessage({
        type: "",
        text: "",
      });

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "bio",
        form.bio.trim()
      );

      if (image) {
        formData.append(
          "image",
          image
        );
      }

      const response = await axios.put(
        `${BASE_URL}/api/artists/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "UPDATE PROFILE RESPONSE:",
        response.data
      );

      const updatedArtist =
        response.data?.artist ||
        response.data;

      setArtist(updatedArtist);

      setForm({
        name: updatedArtist.name || "",
        bio: updatedArtist.bio || "",
      });

      if (updatedArtist.image) {
        setPreview(
          `${getImageUrl(
            updatedArtist.image
          )}?t=${Date.now()}`
        );
      }

      setImage(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (error) {
console.error("UPDATE PROFILE ERROR:", error);

console.error(
"SERVER STATUS:",
error.response?.status
);

console.error(
"SERVER RESPONSE:",
JSON.stringify(error.response?.data, null, 2)
);

console.error(
"REQUEST URL:",
error.config?.url
);

console.error(
"REQUEST METHOD:",
error.config?.method
);

    } finally {
      setSavingProfile(false);
    }
  };

  // =====================================================
  // PASSWORD FORM CHANGE
  // =====================================================
  const handlePasswordChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  const handleChangePassword = async (
    event
  ) => {
    event.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setMessage({
        type: "error",
        text: "Please fill all password fields.",
      });

      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text:
          "New password must be at least 6 characters.",
      });

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setMessage({
        type: "error",
        text: "New passwords do not match.",
      });

      return;
    }

    try {
      setSavingPassword(true);

      setMessage({
        type: "",
        text: "",
      });

      await axios.put(
        `${BASE_URL}/api/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({
        type: "success",
        text: "Password changed successfully.",
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to change password.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#252933] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={38}
            className="text-[#8c7cf7] animate-spin"
          />

          <p className="text-sm text-gray-500">
            Loading artist profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen bg-[#252933] text-white pb-24">

      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8c7cf7] mb-2">
            Artist Account
          </p>

          <h1 className="text-2xl md:text-3xl font-bold">
            Edit Profile
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Manage your artist profile and account security.
          </p>
        </div>

        {/* MESSAGE */}
        {message.text && (
          <div
            className={`
              mb-6
              flex items-center gap-3
              rounded-2xl px-4 py-3
              bg-[#252933]
              shadow-[inset_4px_4px_8px_#0f141a,inset_-4px_-4px_8px_#2a3543]
              ${
                message.type === "success"
                  ? "text-[#2bd4c4]"
                  : "text-red-400"
              }
            `}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}

            <span className="text-sm">
              {message.text}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-6">

          {/* =================================================
              PROFILE
          ================================================= */}
          <form
            onSubmit={handleSaveProfile}
            className="
              rounded-3xl
              bg-[#252933]
              p-5 md:p-7
              shadow-[12px_12px_24px_#0f141a,-12px_-12px_24px_#2a3543]
            "
          >

            <div className="flex items-center gap-3 mb-8">

              <div
                className="
                  w-11 h-11
                  rounded-2xl
                  flex items-center justify-center
                  text-[#8c7cf7]
                  shadow-[inset_4px_4px_8px_#0f141a,inset_-4px_-4px_8px_#2a3543]
                "
              >
                <UserRound size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-lg">
                  Artist Information
                </h2>

                <p className="text-xs text-gray-600">
                  Public artist information
                </p>
              </div>

            </div>

            {/* IMAGE */}
            <div className="flex flex-col items-center mb-8">

              <div className="relative">

                <div
                  className="
                    w-32 h-32 md:w-36 md:h-36
                    rounded-full
                    p-1
                    overflow-hidden
                    bg-[#252933]
                    shadow-[10px_10px_20px_#0f141a,-10px_-10px_20px_#2a3543]
                  "
                >
                  <img
                    src={
                      preview ||
                      "/image/default-cover.jpg"
                    }
                    alt="Artist profile"
                    className="
                      w-full h-full
                      rounded-full
                      object-cover
                    "
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fileRef.current?.click()
                  }
                  className="
                    absolute
                    bottom-1 right-1
                    w-10 h-10
                    rounded-full
                    flex items-center justify-center
                    bg-[#252933]
                    text-[#8c7cf7]
                    shadow-[6px_6px_12px_#0f141a,-6px_-6px_12px_#2a3543]
                    hover:scale-105
                    transition
                  "
                >
                  <Camera size={18} />
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                className="
                  mt-4
                  flex items-center gap-2
                  text-sm text-gray-500
                  hover:text-[#8c7cf7]
                  transition
                "
              >
                <ImagePlus size={16} />
                Change profile image
              </button>

              <p className="text-[11px] text-gray-700 mt-1">
                JPG, PNG or WEBP • Maximum 5MB
              </p>

            </div>

            {/* NAME */}
            <div className="mb-5">

              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Artist Name
              </label>

              <div
                className="
                  flex items-center gap-3
                  rounded-2xl px-4
                  bg-[#252933]
                  shadow-[inset_5px_5px_10px_#0f141a,inset_-5px_-5px_10px_#2a3543]
                "
              >

                <UserRound
                  size={18}
                  className="text-gray-600"
                />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Artist name"
                  className="
                    w-full
                    bg-transparent
                    py-4
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-gray-700
                  "
                />

              </div>

            </div>

            {/* EMAIL */}
            <div className="mb-5">

              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Email
              </label>

              <div
                className="
                  flex items-center gap-3
                  rounded-2xl px-4
                  opacity-60
                  bg-[#252933]
                  shadow-[inset_5px_5px_10px_#0f141a,inset_-5px_-5px_10px_#2a3543]
                "
              >

                <Mail
                  size={18}
                  className="text-gray-600"
                />

                <input
                  type="email"
                  value={
                    artist?.user?.email || ""
                  }
                  disabled
                  className="
                    w-full
                    bg-transparent
                    py-4
                    text-sm
                    text-gray-400
                    outline-none
                    cursor-not-allowed
                  "
                />

              </div>

            </div>

            {/* BIO */}
            <div className="mb-6">

              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Bio
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={6}
                maxLength={500}
                placeholder="Tell listeners about yourself..."
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  p-4
                  bg-[#252933]
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-gray-700
                  shadow-[inset_5px_5px_10px_#0f141a,inset_-5px_-5px_10px_#2a3543]
                "
              />

              <div className="text-right text-[11px] text-gray-700 mt-2">
                {form.bio.length}/500
              </div>

            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4 mb-7">

              <div
                className="
                  rounded-2xl
                  p-4
                  bg-[#252933]
                  shadow-[inset_4px_4px_8px_#0f141a,inset_-4px_-4px_8px_#2a3543]
                "
              >
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Users size={16} />
                  <span className="text-xs">
                    Followers
                  </span>
                </div>

                <p className="font-semibold">
                  {(
                    artist?.followers || 0
                  ).toLocaleString()}
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  p-4
                  bg-[#252933]
                  shadow-[inset_4px_4px_8px_#0f141a,inset_-4px_-4px_8px_#2a3543]
                "
              >
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <ShieldCheck size={16} />
                  <span className="text-xs">
                    Status
                  </span>
                </div>

                <p className="font-semibold text-[#2bd4c4]">
                  {artist?.verified
                    ? "Verified"
                    : "Artist"}
                </p>
              </div>

            </div>

            {/* SAVE */}
            <button
              type="submit"
              disabled={savingProfile}
              className="
                w-full
                flex items-center justify-center gap-2
                rounded-2xl
                py-4
                bg-[#252933]
                text-white
                font-medium
                shadow-[7px_7px_14px_#0f141a,-7px_-7px_14px_#2a3543]
                hover:text-[#8c7cf7]
                active:scale-[0.98]
                transition
                disabled:opacity-50
              "
            >

              {savingProfile ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}

            </button>

          </form>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}
          <div className="space-y-6">

            {/* ACCOUNT STATUS */}
            <div
              className="
                rounded-3xl
                bg-[#252933]
                p-6
                shadow-[12px_12px_24px_#0f141a,-12px_-12px_24px_#2a3543]
              "
            >

              <div className="flex items-center gap-3 mb-6">

                <div
                  className="
                    w-11 h-11
                    rounded-2xl
                    flex items-center justify-center
                    text-[#2bd4c4]
                    shadow-[inset_4px_4px_8px_#0f141a,inset_-4px_-4px_8px_#2a3543]
                  "
                >
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Account Status
                  </h2>

                  <p className="text-xs text-gray-600">
                    Your artist account
                  </p>
                </div>

              </div>

              <div className="space-y-4">

                <StatusRow
                  label="Role"
                  value="Artist"
                  valueClass="text-[#8c7cf7]"
                />

                <StatusRow
                  label="Verification"
                  value={
                    artist?.verified
                      ? "Verified"
                      : "Not verified"
                  }
                  valueClass="text-[#2bd4c4]"
                />

                <StatusRow
                  label="Followers"
                  value={(
                    artist?.followers || 0
                  ).toLocaleString()}
                />

              </div>

            </div>

            {/* CHANGE PASSWORD */}
            <form
              onSubmit={
                handleChangePassword
              }
              className="
                rounded-3xl
                bg-[#252933]
                p-6
                shadow-[12px_12px_24px_#0f141a,-12px_-12px_24px_#2a3543]
              "
            >

              <div className="flex items-center gap-3 mb-6">

                <div
                  className="
                    w-11 h-11
                    rounded-2xl
                    flex items-center justify-center
                    text-[#8c7cf7]
                    shadow-[inset_4px_4px_8px_#0f141a,inset_-4px_-4px_8px_#2a3543]
                  "
                >
                  <KeyRound size={21} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Change Password
                  </h2>

                  <p className="text-xs text-gray-600">
                    Keep your account secure
                  </p>
                </div>

              </div>

              <PasswordInput
                label="Current Password"
                name="currentPassword"
                value={
                  passwordForm.currentPassword
                }
                onChange={
                  handlePasswordChange
                }
                show={
                  showPassword.current
                }
                onToggle={() =>
                  setShowPassword(
                    (previous) => ({
                      ...previous,
                      current:
                        !previous.current,
                    })
                  )
                }
              />

              <PasswordInput
                label="New Password"
                name="newPassword"
                value={
                  passwordForm.newPassword
                }
                onChange={
                  handlePasswordChange
                }
                show={showPassword.new}
                onToggle={() =>
                  setShowPassword(
                    (previous) => ({
                      ...previous,
                      new: !previous.new,
                    })
                  )
                }
              />

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={
                  passwordForm.confirmPassword
                }
                onChange={
                  handlePasswordChange
                }
                show={
                  showPassword.confirm
                }
                onToggle={() =>
                  setShowPassword(
                    (previous) => ({
                      ...previous,
                      confirm:
                        !previous.confirm,
                    })
                  )
                }
              />

              <button
                type="submit"
                disabled={savingPassword}
                className="
                  w-full
                  mt-2
                  flex items-center justify-center gap-2
                  rounded-2xl
                  py-3.5
                  bg-[#252933]
                  text-gray-300
                  shadow-[7px_7px_14px_#0f141a,-7px_-7px_14px_#2a3543]
                  hover:text-[#8c7cf7]
                  active:scale-[0.98]
                  transition
                  disabled:opacity-50
                "
              >

                {savingPassword ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound size={17} />
                    Update Password
                  </>
                )}

              </button>

            </form>

          </div>

        </div>
      </div>

    </div>
  );
};

// =====================================================
// PASSWORD INPUT
// =====================================================
const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  show,
  onToggle,
}) => {
  return (
    <div className="mb-4">

      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </label>

      <div
        className="
          flex items-center gap-3
          rounded-2xl
          px-4
          bg-[#252933]
          shadow-[inset_5px_5px_10px_#0f141a,inset_-5px_-5px_10px_#2a3543]
        "
      >

        <KeyRound
          size={17}
          className="text-gray-600 shrink-0"
        />

        <input
          type={
            show
              ? "text"
              : "password"
          }
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
          className="
            flex-1
            min-w-0
            bg-transparent
            py-3.5
            text-sm
            text-white
            outline-none
            placeholder:text-gray-700
          "
        />

        <button
          type="button"
          onClick={onToggle}
          className="
            text-gray-600
            hover:text-[#8c7cf7]
            transition
          "
        >
          {show ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>

      </div>
    </div>
  );
};

// =====================================================
// STATUS ROW
// =====================================================
const StatusRow = ({
  label,
  value,
  valueClass = "",
}) => {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-gray-600">
        {label}
      </span>

      <span
        className={`text-sm font-medium ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
};

export default EditProfile;