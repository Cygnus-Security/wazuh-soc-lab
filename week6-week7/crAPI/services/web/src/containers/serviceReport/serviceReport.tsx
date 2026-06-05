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

import React, { useState, useEffect } from "react";

import { connect, ConnectedProps } from "react-redux";
import { Modal } from "antd";
import { getServiceReportAction } from "../../actions/userActions";
import ServiceReport from "../../components/serviceReport/serviceReport";
import responseTypes from "../../constants/responseTypes";
import { FAILURE_MESSAGE } from "../../constants/messages";

interface RootState {
  userReducer: {
    accessToken: string;
  };
}

interface Service {
  id: string;
  problem_details: string;
  created_on: string;
  vehicle: {
    owner: {
      email: string;
      number: string;
    };
    id: string;
    vin: string;
  };
  status: string;
  mechanic: {
    mechanic_code: string;
    user: {
      email: string;
      number: string;
    };
  };
  comments: {
    comment: string;
    created_on: string;
  }[];
  downloadUrl?: string;
}

const mapStateToProps = (state: RootState) => ({
  accessToken: state.userReducer.accessToken,
});

const mapDispatchToProps = {
  getServiceReport: getServiceReportAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const ServiceReportContainer: React.FC<PropsFromRedux> = ({
  accessToken,
  getServiceReport,
}) => {
  const [service, setService] = useState<Service>();
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get("id");
  console.log("reportId", reportId);

  useEffect(() => {
    const callback = (res: string, data: Service | string) => {
      console.log("Callback", res, data);
      if (res === responseTypes.SUCCESS) {
        setService(data as Service);
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data as string,
        });
      }
    };
    console.log("getServiceReport", accessToken, reportId, callback);
    getServiceReport({ accessToken, reportId, callback });
  }, [accessToken, getServiceReport, reportId]);

  // Ensure that the Service type in the component matches the one from the API
  // Ensure that the Service type in the component matches the one from the API
  // Ensure that the Service type in the component matches the one from the API
  return <ServiceReport service={service as Service} />;
};

export default connector(ServiceReportContainer);
