const API_BASE_URL = "http://127.0.0.1:8000";

const getAuthHeaders = () => {
    const isBrowser = typeof window !== "undefined";
    const token = isBrowser ? localStorage.getItem("access_token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
};

export async function createAssessment({ data }: { data: any }) {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to process student assessment");
    return await response.json();
}

export async function listAssessments() {
    const response = await fetch(`${API_BASE_URL}/assessments`, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    return await response.json();
}

export async function deleteAssessment({ data }: { data: { id: string } }) {
    await fetch(`${API_BASE_URL}/assessments/${data.id}`, { method: "DELETE", headers: getAuthHeaders() });
    return true;
}

export async function toggleActionCompleted({ data }: { data: { id: string } }) {
    await fetch(`${API_BASE_URL}/assessments/${data.id}/complete`, { method: "PUT", headers: getAuthHeaders() });
    return true;
}

export async function listDeptProfessors() {
    const response = await fetch(`${API_BASE_URL}/dept/professors`, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    return await response.json();
}

export async function getProfessorAnalytics({ data }: { data: { professor_id: string } }) {
    const response = await fetch(`${API_BASE_URL}/professors/${data.professor_id}/analytics`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) return { total: 0, completed: 0, low: 0, medium: 0, high: 0 };
    return await response.json();
}

export async function getProfile() {
    const isBrowser = typeof window !== "undefined";
    const userStr = isBrowser ? localStorage.getItem("failsafe_user") : null;
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch {
            /* fall through */
        }
    }
    return { full_name: "Professor", role: "professor", department: "General" };
}
export async function getAssessment({ data }: { data: { id: string } }) {
    const response = await fetch(`${API_BASE_URL}/assessments/${data.id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to load assessment");
    return await response.json();
}