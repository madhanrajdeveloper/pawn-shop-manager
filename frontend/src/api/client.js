// frontend/src/api/client.js
import axios from 'axios';

// This points to your FastAPI server running locally
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;