
import axios from "axios";
import { BASE_URL } from "../../config/api";

const API_URL = `${BASE_URL}/api/superadmin/artist-applications`;

// ==========================================
// AUTH CONFIGURATION
// ==========================================
const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ==========================================
// GET ARTIST APPLICATIONS
// ==========================================
export const getArtistApplications = async ({
  status = "",
  search = "",
  page = 1,
  limit = 20,
} = {}) => {
  try {
    const response = await axios.get(API_URL, {
      ...getAuthConfig(),
      params: {
        status,
        search,
        page,
        limit,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "GET ARTIST APPLICATIONS ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// GET SINGLE APPLICATION
// ==========================================
export const getArtistApplication = async (id) => {
  if (!id) {
    throw new Error("Artist application ID is required.");
  }

  const response = await axios.get(
    `${API_URL}/${encodeURIComponent(id)}`,
    getAuthConfig()
  );

  return response.data;
};

// ==========================================
// APPROVE / REJECT APPLICATION
// Backend expects "approved" or "rejected".
// ==========================================
export const reviewArtistApplication = async (
id,
status,
admin_note = ""
) => {
if (!id || typeof id !== "string") {
throw new Error("A valid artist application ID is required.");
}

if (!["approved", "rejected"].includes(status)) {
throw new Error(
'Review status must be "approved" or "rejected".'
);
}

try {
const response = await axios.patch(
`${API_URL}/${encodeURIComponent(id)}/review`,
{
status,
admin_note,
},
getAuthConfig()
);

return response.data;

} catch (error) {
console.error(
"ARTIST APPLICATION REVIEW FAILED:",
error.response?.data || error.message
);


throw error;


}
};

