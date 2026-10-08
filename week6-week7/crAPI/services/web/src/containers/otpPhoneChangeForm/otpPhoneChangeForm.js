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

import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Modal } from "antd";
import { verifyPhoneChangeOTPAction } from "../../actions/userActions";
import responseTypes from "../../constants/responseTypes";
import { SUCCESS_MESSAGE } from "../../constants/messages";
import { useNavigate } from "react-router-dom";
import OTPChangePhoneForm from "../../components/otpChangePhoneForm/otpChangePhoneForm";

const OtpPhoneChangeFormContainer = (props) => {
  const { accessToken, oldPhoneNumber } = props;
  const navigate = useNavigate();
  const [hasErrored, setHasErrored] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const callback = (res, data) => {
    if (res === responseTypes.SUCCESS) {
      Modal.success({
        title: SUCCESS_MESSAGE,
        content: data,
        onOk: () => navigate("/my-profile"),
      });
    } else {
      setHasErrored(true);
      setErrorMessage(data);
    }
  };

  const onFinish = (values) => {
    const { accessToken, number, newPhoneNumber } = props;
    props.verifyPhoneChangeOTP({
      ...values,
      callback,
      accessToken,
      new_number: number,
      old_number: oldPhoneNumber,
    });
  };

  return (
    <OTPChangePhoneForm
      onFinish={onFinish}
      hasErrored={hasErrored}
      errorMessage={errorMessage}
    />
  );
};

const mapDispatchToProps = {
  verifyPhoneChangeOTP: verifyPhoneChangeOTPAction,
};

const mapStateToProps = ({ userReducer: { accessToken, number } }) => {
  return { accessToken, oldPhoneNumber: number };
};

OtpPhoneChangeFormContainer.propTypes = {
  verifyPhoneChangeOTP: PropTypes.func,
  oldPhoneNumber: PropTypes.string,
  newPhoneNumber: PropTypes.string,
  accessToken: PropTypes.string,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OtpPhoneChangeFormContainer);
