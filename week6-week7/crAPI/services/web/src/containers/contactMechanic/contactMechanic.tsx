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

import React, { useEffect } from "react";

import { connect, ConnectedProps } from "react-redux";
import { Modal } from "antd";
import ContactMechanic from "../../components/contactMechanic/contactMechanic";
import { useNavigate } from "react-router-dom";
import {
  getMechanicsAction,
  contactMechanicAction,
} from "../../actions/vehicleActions";
import responseTypes from "../../constants/responseTypes";
import { SUCCESS_MESSAGE } from "../../constants/messages";
import { RootState } from "../../reducers/rootReducer";

type PropsFromRedux = ConnectedProps<typeof connector>;

const ContactMechanicContainer: React.FC<PropsFromRedux> = (props) => {
  const navigate = useNavigate();
  const { accessToken, getMechanics, contactMechanic } = props;
  const [hasErrored, setHasErrored] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  useEffect(() => {
    const callback = (status: string, data: any) => {
      if (status !== responseTypes.SUCCESS) {
        setHasErrored(true);
        setErrorMessage(data);
        return;
      }
    };
    getMechanics({ accessToken, callback });
  }, [accessToken, getMechanics]);

  const onFinish = (values: any) => {
    const callback = (status: string, data: any) => {
      if (status === responseTypes.SUCCESS) {
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: data,
          onOk: () => navigate("/mechanic-dashboard"),
        });
      } else {
        setHasErrored(true);
        setErrorMessage(data);
      }
    };
    props.contactMechanic({
      callback,
      accessToken,
      ...values,
    });
  };

  return (
    <ContactMechanic
      onFinish={onFinish}
      hasErrored={hasErrored}
      errorMessage={errorMessage}
    />
  );
};

const mapStateToProps = ({ userReducer: { accessToken } }: RootState) => {
  return { accessToken };
};

const mapDispatchToProps = {
  getMechanics: getMechanicsAction,
  contactMechanic: contactMechanicAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(ContactMechanicContainer);
