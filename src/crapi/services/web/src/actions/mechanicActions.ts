import actionTypes from "../constants/actionTypes";

interface ActionPayload {
  accessToken: string;
  callback: (res: any, data?: any) => void;
  [key: string]: any;
}

export const createCommentAction = ({
  accessToken,
  serviceId,
  comment,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.CREATE_SERVICE_COMMENT,
    payload: { accessToken, serviceId, comment, ...data, callback },
  };
};

export const updateServiceRequestStatusAction = ({
  accessToken,
  serviceId,
  status,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.UPDATE_SERVICE_REQUEST_STATUS,
    payload: { accessToken, serviceId, status, ...data, callback },
  };
};
