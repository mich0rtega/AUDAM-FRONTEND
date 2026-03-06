import api from "./api";
import { 
  ForgotPasswordRequest, 
  ForgotPasswordResponse 
} from "../types";

export const passwordService = {
  // Solicitar restablecimiento (notifica al admin)
  requestPasswordReset: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await api.post("/password/request-reset", data);
    return response.data;
  }
};