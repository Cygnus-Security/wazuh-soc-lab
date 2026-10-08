/*
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";

import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Modal } from "antd";
import {
  registerVehicleAction,
  verifyVehicleAction,
} from "../../actions/vehicleActions";
import VerifyVehicle from "../../components/verifyVehicle/verifyVehicle";
import responseTypes from "../../constants/responseTypes";
import { SUCCESS_MESSAGE } from "../../constants/messages";
import { useNavigate } from "react-router-dom";

const VerifyVehicleContainer = (props) => {
  const navigate = useNavigate();
  const { registerVehicle, verifyVehicle } = props;
  const { accessToken, vehicles } = props;

  const [hasErrored, setHasErrored] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [vehicleRegistered, setVehicleRegistered] = React.useState(0);
  const [registrationMessage, setRegistrationMessage] = React.useState("");

  const onRegisterVehicle = () => {
    setVehicleRegistered(1);
    const callback = (res, data) => {
      if (res === responseTypes.SUCCESS) {
        setVehicleRegistered(2);
        setRegistrationMessage(data);
      } else {
        setVehicleRegistered(0);
        setRegistrationMessage(data);
      }
    };
    registerVehicle({ callback, accessToken });
  };

  const onFinish = (values) => {
    const callback = (res, data) => {
      if (res === responseTypes.SUCCESS) {
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: data,
          onOk: () => navigate("/dashboard"),
        });
      } else {
        setHasErrored(true);
        setErrorMessage(data);
      }
    };
    verifyVehicle({
      callback,
      accessToken,
      ...values,
    });
  };

  return (
    <VerifyVehicle
      onFinish={onFinish}
      hasErrored={hasErrored}
      errorMessage={errorMessage}
      onRegisterVehicle={onRegisterVehicle}
      vehicleRegistered={vehicleRegistered}
      registrationMessage={registrationMessage}
      vehicles={vehicles}
    />
  );
};

const mapStateToProps = ({
  userReducer: { accessToken },
  vehicleReducer: { vehicles },
}) => {
  return { accessToken, vehicles };
};

const mapDispatchToProps = {
  registerVehicle: registerVehicleAction,
  verifyVehicle: verifyVehicleAction,
};

VerifyVehicleContainer.propTypes = {
  accessToken: PropTypes.string,
  registerVehicle: PropTypes.func,
  verifyVehicle: PropTypes.func,
  vehicles: PropTypes.array,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VerifyVehicleContainer);
