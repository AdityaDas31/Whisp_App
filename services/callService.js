import axios from "axios";
import { API_BASE_URL } from "../config"

const API = `${API_BASE_URL}/calls`;

export const getCallHistory = async (userId) => {
  const res = await axios.get(`${API}/history/${userId}`);
  return res.data.calls;
};

export const deleteCallLog = async (callId) => {
  await axios.delete(`${API}/${callId}`);
};