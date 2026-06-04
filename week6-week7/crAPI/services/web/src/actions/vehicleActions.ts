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
  accessToken: string;
  callback: (res: string, data: any) => void;
  [key: string]: any;
}

interface GetVehiclesPayload extends ActionPayload {
  email?: string;
}

export const registerVehicleAction = ({
  callback,
  accessToken,
}: ActionPayload) => {
  return {
    type: actionTypes.REGISTER_VEHICLE,
    payload: {
      accessToken,
      callback,
    },
  };
};

export const verifyVehicleAction = ({
  callback,
  accessToken,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.VERIFY_VEHICLE,
    payload: {
      accessToken,
      callback,
      ...data,
    },
  };
};

export const getMechanicsAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.GET_MECHANICS,
    payload: {
      accessToken,
      callback,
      ...data,
    },
  };
};

export const getVehiclesAction = ({
  callback,
  accessToken,
  email,
  ...data
}: GetVehiclesPayload) => {
  return {
    type: actionTypes.GET_VEHICLES,
    payload: {
      accessToken,
      callback,
      ...data,
    },
  };
};

export const resendMailAction = ({ callback, accessToken }: ActionPayload) => {
  return {
    type: actionTypes.RESEND_MAIL,
    payload: {
      accessToken,
      callback,
    },
  };
};

export const contactMechanicAction = ({
  callback,
  accessToken,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.CONTACT_MECHANIC,
    payload: {
      accessToken,
      callback,
      ...data,
    },
  };
};

export const refreshLocationAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.REFRESH_LOCATION,
    payload: {
      accessToken,
      callback,
      ...data,
    },
  };
};
