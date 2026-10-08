/*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import actionTypes from "../constants/actionTypes";

interface ActionPayload {
  callback: (...args: any[]) => void;
  [key: string]: any;
}

interface LoginPayload extends ActionPayload {
  email: string;
  password: string;
}

interface UnlockPayload extends ActionPayload {
  email: string;
  code: string;
}

interface UnlockRedirectPayload extends ActionPayload {
  email: string;
  message: string;
}

interface SignUpPayload extends ActionPayload {
  name: string;
  email: string;
  number: string;
  password: string;
}

interface AccessTokenPayload {
  accessToken: string;
}

interface VerifyOTPPayload extends ActionPayload {
  otp: string;
  email: string;
  password: string;
}

interface VerifyPhoneChangeOTPPayload extends ActionPayload {
  otp: string;
  old_number: string;
  new_number: string;
}

interface ResetPasswordPayload extends ActionPayload {
  email: string;
  accessToken: string;
  password: string;
}

export const logInUserAction = ({
  email,
  password,
  callback,
}: LoginPayload) => {
  return {
    type: actionTypes.LOG_IN,
    payload: { email, password, callback },
  };
};

export const unlockUserAction = ({ email, code, callback }: UnlockPayload) => {
  console.log("unlockUserAction", email, code, callback);
  return {
    type: actionTypes.UNLOCK_USER,
    payload: { email, code, callback },
  };
};

export const unlockRedirectUserAction = ({
  email,
  message,
  callback,
}: UnlockRedirectPayload) => {
  console.log("unlockRedirectUserAction", email, message, callback);
  return {
    type: actionTypes.UNLOCK_USER_REDIRECT,
    payload: { email, message, callback },
  };
};

export const signUpUserAction = ({
  name,
  email,
  number,
  password,
  callback,
}: SignUpPayload) => {
  return {
    type: actionTypes.SIGN_UP,
    payload: { name, email, number, password, callback },
  };
};

// clear store data and local storage and log user out
export const logOutUserAction = ({ callback }: ActionPayload) => {
  return {
    type: actionTypes.LOG_OUT,
    payload: { callback },
  };
};

export const validateAccessTokenAction = ({
  accessToken,
}: AccessTokenPayload) => {
  console.log("validateAccessTokenAction action");
  return {
    type: actionTypes.VALIDATE_ACCESS_TOKEN,
    payload: { accessToken },
  };
};

export const invalidSessionAction = () => {
  return {
    type: actionTypes.INVALID_SESSION,
  };
};

export const forgotPasswordAction = ({ email, callback }: LoginPayload) => {
  return {
    type: actionTypes.FORGOT_PASSWORD,
    payload: { email, callback },
  };
};

export const verifyOTPAction = ({
  otp,
  email,
  password,
  callback,
}: VerifyOTPPayload) => {
  return {
    type: actionTypes.VERIFY_OTP,
    payload: { otp, email, password, callback },
  };
};

export const verifyPhoneChangeOTPAction = ({
  accessToken,
  otp,
  old_number,
  new_number,
  callback,
}: VerifyPhoneChangeOTPPayload) => {
  return {
    type: actionTypes.VERIFY_PHONE_NUMBER_OTP,
    payload: { accessToken, otp, old_number, new_number, callback },
  };
};

export const resetPasswordAction = ({
  email,
  accessToken,
  password,
  callback,
}: ResetPasswordPayload) => {
  return {
    type: actionTypes.RESET_PASSWORD,
    payload: { email, accessToken, password, callback },
  };
};

export const getMechanicServicesAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.GET_MECHANIC_SERVICES,
    payload: { accessToken, callback, ...data },
  };
};

export const getMechanicServiceAction = ({
  accessToken,
  serviceId,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.GET_MECHANIC_SERVICE,
    payload: { accessToken, serviceId, callback, ...data },
  };
};

export const getVehicleServicesAction = ({
  accessToken,
  VIN,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.GET_VEHICLE_SERVICES,
    payload: { accessToken, VIN, callback, ...data },
  };
};

export const getServiceReportAction = ({
  accessToken,
  reportId,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.GET_SERVICE_REPORT,
    payload: { accessToken, reportId, callback, ...data },
  };
};

export const changeEmailAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.CHANGE_EMAIL,
    payload: { accessToken, callback, ...data },
  };
};

export const changePhoneNumberAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.CHANGE_PHONE_NUMBER,
    payload: { accessToken, callback, ...data },
  };
};

export const verifyTokenAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload & AccessTokenPayload) => {
  return {
    type: actionTypes.VERIFY_TOKEN,
    payload: { accessToken, callback, ...data },
  };
};
