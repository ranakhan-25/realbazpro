import api from "@/lib/api";

export interface SysFileResponse {
  id: number;
  fileName: string;
  filePath: string; // The storage key, e.g. "crm/leads/lead-doc-1234.pdf"
  originalName?: string;
  mimeType: string;
  originalSize: number;
  bucketName: string;
  uploadedBy?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadFileOptions {
  /**
   * Target folder within storage bucket (e.g., 'crm/leads', 'projects/agreements', 'avatars', 'organizations/logos')
   */
  pathFolder?: string;
  /**
   * Custom semantic base filename (e.g., 'agreement-v1', 'profile-picture')
   */
  fileName?: string;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

export const fileUploadService = {
  /**
   * Upload a file directly using the standard /files/upload route.
   * Supports custom pathFolder and custom fileName for clean storage organization.
   */
  upload: async (
    file: File | Blob,
    options?: UploadFileOptions
  ): Promise<SysFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.pathFolder) {
      formData.append("pathFolder", options.pathFolder.trim());
    }

    if (options?.fileName) {
      formData.append("fileName", options.fileName.trim());
    }

    const response = await api.post<SysFileResponse>("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Get the direct public streaming URL for a file key.
   * Endpoint: GET /realbizpro/api/v1/files/content/{key}
   */
  getContentUrl: (key: string): string => {
    if (!key) return "";
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    // Clean leading slash if present
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;
    return `${API_BASE_URL}/files/content/${cleanKey}`;
  },

  /**
   * Delete a file by key
   */
  delete: async (key: string): Promise<{ message: string }> => {
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;
    const response = await api.delete<{ message: string }>(`/files/${cleanKey}`);
    return response.data;
  },
};

export default fileUploadService;
