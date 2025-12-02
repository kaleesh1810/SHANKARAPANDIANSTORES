import axios from "axios";
import Notiflix from 'notiflix';

// Sound to play on error alerts
const ERROR_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

// Initialize Notiflix defaults (centered, fade animation)
Notiflix.Notify.init({
  position: 'right-top',
  timeout: 4000,
  cssAnimation: true,
  cssAnimationDuration: 400,
  cssAnimationStyle: 'fade',
});
Notiflix.Report.init({
  cssAnimation: true,
  cssAnimationDuration: 400,
  cssAnimationStyle: 'fade',
});

const playErrorSound = () => {
  if (typeof window === 'undefined' || typeof window.Audio !== 'function') return;
  try {
    const a = new Audio(ERROR_SOUND_URL);
    // ignore play promise rejections silently
    a.play().catch(() => {});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not play error sound', e);
  }
};

// Ensure the Notiflix notify wrapper is visually centered in the middle of the screen.
// Notiflix does not provide a direct "center of screen" toast position, so we
// adjust the wrapper's inline style when notifications are shown.
const centerNotifyWrapper = () => {
  if (typeof document === 'undefined') return;
  const wrapper = document.querySelector('.notiflix-notify-wrapper');
  if (!wrapper) return;
  // Make the wrapper fixed and center it both horizontally and vertically.
  wrapper.style.position = 'fixed';
  wrapper.style.top = '50%';
  wrapper.style.left = '50%';
  wrapper.style.right = 'auto';
  wrapper.style.transform = 'translate(-50%, -50%)';
  // Allow notifications to wrap and not exceed viewport width.
  wrapper.style.maxWidth = '90%';
  wrapper.style.zIndex = '99999';
};

// Position the notify wrapper at the top-right of the viewport.
const positionNotifyTopRight = () => {
  if (typeof document === 'undefined') return;
  const wrapper = document.querySelector('.notiflix-notify-wrapper');
  if (!wrapper) return;
  wrapper.style.position = 'fixed';
  wrapper.style.top = '50%';
  wrapper.style.left = '50%';
  wrapper.style.right = 'auto';
  wrapper.style.transform = 'translate(-50%, -50%)';
  // Allow notifications to wrap and not exceed viewport width.
  wrapper.style.maxWidth = '90%';
  wrapper.style.zIndex = '99999';
};

const apiService = axios.create({
  baseURL: "http://dikshiserver/spstores/api/",
  headers: { "Content-Type": "application/json" },
});

// Add response interceptor to suppress 404 errors in console
apiService.interceptors.response.use(
  response => response,
  error => {
    // Check if this is a 404 error - suppress console logging for it
    if (error.response && error.response.status === 404) {
      // Suppress the default axios error logging for 404s
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// API Base URL
export const API_BASE = "http://dikshiserver/spstores/api";

// API Endpoints Configuration
export const API_ENDPOINTS = {
  ADMINISTRATION: {
    USER_LIST: "Administartor/UserNameList",
    GET_PERMISSIONS_BY_USER: "Administartor/GetPermissionsByUserCode",
    ADMIN_BATCH_INSERT: "Administartor/administration/InsertBatch",
    DELETE_PERMISSIONS: "Administartor/administration/delete"
  }
};

// Generic request handlers
// const get = async (url, params = {}) => {
//   try {
//     const response = await apiService.get(url, { params });
//     return response.data;
//   } catch (error) {
//     console.error("GET request error:", error);
//     throw error;
//   }
// };


// const post = async (url, data) => {
//   try {
//     const response = await apiService.post(url, data);
//     return response.data;
//   } catch (error) {
//     console.error("POST request error:", error);
//     throw error;
//   }
// };

// const put = async (url, data) => {
//   try {
//     const response = await apiService.put(url, data);
//     return response.data;
//   } catch (error) {
//     console.error("PUT request error:", error);
//     throw error;
//   }
// };

// const del = async (url) => {
//   try {
//     const response = await apiService.delete(url);
//     return response.data;
//   } catch (error) {
//     console.error("DELETE request error:", error);
//     throw error;
//   }
// };

// Helper: show an alert for a given HTTP status (uses window.alert in browser)
const showAlertForStatus = (status, responseData, fallbackMessage) => {
  let message = fallbackMessage || "";

  switch (status) {
    case 400:
      message = (responseData && responseData.message) || "Bad request.";
      break;
    case 401:
      message = "Unauthorized. Please login again.";
      break;
    case 403:
      message = "Forbidden. You don't have permission to perform this action.";
      break;
    case 404:
      message = "Resource not found.";
      break;
    case 422:
      message = (responseData && responseData.message) || "Validation error.";
      break;
    case 500:
      message = "Server error. Please try again later.";
      break;
    default:
      if (status >= 200 && status < 300) {
        // success - no alert by default
        return;
      }
      message = message || `Unexpected status code: ${status}`;
  }

  // Show UI notifications in browser using Notiflix (centered, fade animation)
  if (typeof window !== 'undefined') {
    // 400-499 -> orange toast (use Warning style)
    if (status >= 400 && status <= 499) {
      Notiflix.Report.warning(message || 'Request error','');
      positionNotifyTopRight();
      playErrorSound();
      return;
    }

    // 500 -> red popup with OK button
    if (status === 500) {
      Notiflix.Report.failure('Server Error', message || 'Server error. Please try again later.', 'OK');
      centerNotifyWrapper();
      playErrorSound();
      return;
    }

    // Other non-success statuses -> generic failure toast
    Notiflix.Notify.failure(message || `Unexpected status code: ${status}`, 'OK');
    positionNotifyTopRight();
    playErrorSound();
    return;
  }

  // Fallback for non-browser environments or tests: console warning
  // eslint-disable-next-line no-console
  console.warn('ALERT:', message);
};

// Generic request wrapper that shows alerts for non-success status codes
const requestWithAlert = async ({ method = "get", url, data = null, params = {} }) => {
  try {
    const response = await apiService.request({ method, url, data, params });

    // If response status is not 2xx, show alert (but still return response.data)
    if (response && typeof response.status === "number" && !(response.status >= 200 && response.status < 300)) {
      showAlertForStatus(response.status, response.data);
    }

    return response.data; // DO NOT disturb response.data per requirement
  } catch (error) {
    // axios error: try to extract response status/data
    if (error && error.response) {
      const status = error.response.status;
      const respData = error.response.data;
      showAlertForStatus(status, respData, error.message);
      throw error; // preserve previous behavior (caller can still catch)
    }

    // Network or other error without response
    const msg = (error && error.message) || 'Network error';
    if (typeof window !== 'undefined') {
      Notiflix.Notify.failure(msg || 'Network error');
      positionNotifyTopRight();
      playErrorSound();
    } else {
      // eslint-disable-next-line no-console
      console.warn('ALERT:', msg);
    }
    throw error;
  }
};

// Convenience wrappers that show alerts for non-success statuses
const get = (url, params = {}) => requestWithAlert({ method: "get", url, params });
const post = (url, data) => requestWithAlert({ method: "post", url, data });
const put = (url, data) => requestWithAlert({ method: "put", url, data });
const del = (url) => requestWithAlert({ method: "delete", url });

// Silent methods that don't show alerts (for fallback scenarios)
const getSilent = async (url, params = {}) => {
  try {
    // Use fetch directly to avoid axios logging
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `http://dikshiserver/spstores/api/${url}${queryString ? '?' + queryString : ''}`;
    
    // Suppress network errors in DevTools by using signal/abort
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Silently catch and return null - no logging, no alerts
    return null;
  }
};

export default {
  get,
  post,
  put,
  del,
  getSilent,
  // new, opt-in methods that display alerts for non-2xx/other error statuses
  requestWithAlert, 
};

// Provide the underlying axios instance as a named export for compatibility
export const axiosInstance = apiService;
